import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Upload, X, Check, RotateCcw } from 'lucide-react';

interface LogoCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImageData: string, logoType: 'square' | 'rectangle') => void;
  logoType: 'square' | 'rectangle';
  title: string;
}

const LogoCropper: React.FC<LogoCropperProps> = ({
  isOpen,
  onClose,
  onSave,
  logoType,
  title
}) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Define aspect ratios and target dimensions
  const aspectRatio = logoType === 'square' ? 1 : 350 / 75; // 4.67 for rectangle
  const targetWidth = logoType === 'square' ? 200 : 350;
  const targetHeight = logoType === 'square' ? 200 : 75;

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || ''),
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Calculate initial crop to fit the aspect ratio
    let cropWidth, cropHeight;
    
    if (logoType === 'square') {
      // For square, use 80% of the smaller dimension to leave some margin
      const size = Math.min(width, height) * 0.8;
      cropWidth = cropHeight = size;
    } else {
      // Rectangle: fit to aspect ratio
      if (width / height > aspectRatio) {
        cropHeight = height * 0.8;
        cropWidth = cropHeight * aspectRatio;
      } else {
        cropWidth = width * 0.8;
        cropHeight = cropWidth / aspectRatio;
      }
    }

    const crop: Crop = {
      unit: 'px',
      width: cropWidth,
      height: cropHeight,
      x: (width - cropWidth) / 2,
      y: (height - cropHeight) / 2,
    };

    setCrop(crop);
  };

  const generateCroppedImage = useCallback(
    async (canvas: HTMLCanvasElement, crop: PixelCrop) => {
      const image = imgRef.current;
      const previewCanvas = previewCanvasRef.current;

      if (!image || !previewCanvas || !crop) {
        throw new Error('Crop canvas does not exist');
      }

      // Map crop (pixel units on displayed image) to the image's natural pixel space
      const naturalScaleX = image.naturalWidth / image.width;
      const naturalScaleY = image.naturalHeight / image.height;

      // Center of the crop in natural pixels
      const cropCenterX = (crop.x + crop.width / 2) * naturalScaleX;
      const cropCenterY = (crop.y + crop.height / 2) * naturalScaleY;

      // Apply zoom (scale): zoom > 1 means zoom in, so the source window is smaller
      const sourceWidth = (crop.width * naturalScaleX) / Math.max(scale, 0.001);
      const sourceHeight = (crop.height * naturalScaleY) / Math.max(scale, 0.001);

      // Compute top-left ensuring we stay within image bounds
      let sourceX = cropCenterX - sourceWidth / 2;
      let sourceY = cropCenterY - sourceHeight / 2;
      if (sourceX < 0) sourceX = 0;
      if (sourceY < 0) sourceY = 0;
      if (sourceX + sourceWidth > image.naturalWidth) sourceX = image.naturalWidth - sourceWidth;
      if (sourceY + sourceHeight > image.naturalHeight) sourceY = image.naturalHeight - sourceHeight;

      // Set the size of the preview canvas to our target dimensions
      previewCanvas.width = targetWidth;
      previewCanvas.height = targetHeight;

      // Draw the cropped area to the preview canvas
      const previewCtx = previewCanvas.getContext('2d');
      if (previewCtx) {
        previewCtx.clearRect(0, 0, targetWidth, targetHeight);
        
        // Draw directly from the natural image
        previewCtx.drawImage(
          image,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          targetWidth,
          targetHeight,
        );
      }

      return previewCanvas.toDataURL('image/png');
    },
    [targetWidth, targetHeight, scale],
  );

  // Update preview whenever crop changes
  React.useEffect(() => {
    if (completedCrop && imgRef.current && previewCanvasRef.current) {
      console.log('Crop data:', {
        crop: completedCrop,
        scale: scale,
        imageSize: { width: imgRef.current.width, height: imgRef.current.height },
        naturalSize: { width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight }
      });
      generateCroppedImage(previewCanvasRef.current, completedCrop);
    }
  }, [completedCrop, generateCroppedImage, scale]);

  const handleSave = async () => {
    if (completedCrop && imgRef.current && previewCanvasRef.current) {
      try {
        const base64Data = await generateCroppedImage(
          previewCanvasRef.current,
          completedCrop,
        );
        
        onSave(base64Data, logoType);
        handleClose();
      } catch (error) {
        console.error('Error generating cropped image:', error);
      }
    }
  };

  const handleClose = () => {
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setScale(1);
    onClose();
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Target size: {targetWidth} × {targetHeight}px ({logoType === 'square' ? 'Square' : 'Rectangle'})
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* File Upload */}
          {!imgSrc && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="mb-4">
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <span className="text-lg font-medium text-gray-900">
                    Choose an image to upload
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={onSelectFile}
                  className="hidden"
                />
              </div>
              <button
                onClick={() => document.getElementById('logo-upload')?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Select Image
              </button>
            </div>
          )}

          {/* Cropping Interface */}
          {imgSrc && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">Image Size:</label>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={scale}
                        onChange={(e) => setScale(Number(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-sm text-gray-600 min-w-[3rem]">{scale.toFixed(1)}x</span>
                      <button
                        onClick={() => setScale(1)}
                        className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Resize the image to fit your desired area into the crop box
                  </div>
                </div>
              </div>

              {/* Main Cropping Area */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Original Image with Crop */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Original Image</h4>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={aspectRatio}
                      minWidth={50}
                      minHeight={logoType === 'square' ? 50 : 20}
                    >
                      <img
                        ref={imgRef}
                        alt="Crop me"
                        src={imgSrc}
                        style={{
                          transform: `scale(${scale})`,
                          transformOrigin: 'center',
                          maxWidth: '100%',
                          maxHeight: '400px',
                        }}
                        onLoad={onImageLoad}
                      />
                    </ReactCrop>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Preview ({targetWidth} × {targetHeight}px)
                  </h4>
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-center min-h-[200px]">
                      {completedCrop ? (
                        <canvas
                          ref={previewCanvasRef}
                          style={{
                            border: '1px solid #ccc',
                            objectFit: 'contain',
                            width: Math.min(targetWidth, 300),
                            height: Math.min(targetHeight, 300 * (targetHeight / targetWidth)),
                          }}
                        />
                      ) : (
                        <div className="text-gray-400 text-center">
                          <p>Crop preview will appear here</p>
                          <p className="text-sm mt-1">Adjust the crop area above</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setImgSrc('');
                    setCrop(undefined);
                    setCompletedCrop(undefined);
                  }}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Choose Different Image
                </button>
                <button
                  onClick={handleSave}
                  disabled={!completedCrop}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Save {logoType === 'square' ? 'Square' : 'Rectangle'} Logo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogoCropper;
