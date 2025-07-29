import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileImage, Loader2, Check, Download, FileText } from "lucide-react";

const CodeExtractor = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [extractedCodes, setExtractedCodes] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      toast({
        title: "Invalid Files",
        description: "Please select valid image files.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFiles(imageFiles);
    toast({
      title: "Files Selected",
      description: `${imageFiles.length} image(s) ready for processing.`,
    });
  }, [toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const processImages = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch("http://localhost:5000/extract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unknown error");
      }

      setExtractedCodes(data.codes || []);
      setIsProcessed(true);

      toast({
        title: "Processing Complete",
        description: `Extracted ${data.codes.length} code(s) from ${selectedFiles.length} image(s).`,
      });

    } catch (error: any) {
      toast({
        title: "Processing Error",
        description: error.message || "An error occurred while processing the images.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTxt = () => {
    if (extractedCodes.length === 0) return;
    const content = extractedCodes.join("\n");
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
  if (extractedCodes.length === 0) return;
  const header = "Code\n";
  const rows = extractedCodes.map(code => `${code}`).join("\n");
  const csvContent = header + rows;
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'extracted_codes.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};


  return (
    <div className="min-h-screen bg-gradient-primary p-4">
      <div className="container max-w-4xl mx-auto">
        <Card className="mb-8 overflow-hidden bg-gradient-header border-0 shadow-custom-xl">
          <div className="p-8 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Code Extractor</h1>
            <p className="text-xl opacity-90">Extract recharge codes from images with AI precision</p>
          </div>
        </Card>

        <Card className="p-8 bg-gradient-card border-0 shadow-custom-xl">
          <div
            className={`border-3 border-dashed rounded-xl p-12 text-center mb-8 transition-all duration-300 cursor-pointer ${
              isDragOver 
                ? "border-success bg-success/10 transform scale-105" 
                : "border-primary bg-gradient-upload hover:border-primary-dark hover:bg-muted/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center space-y-4">
              <Upload className="w-16 h-16 text-primary" />
              <div>
                <p className="text-xl font-semibold text-foreground mb-2">
                  Drag & drop images here or click to browse
                </p>
                <p className="text-muted-foreground">
                  Supports JPG, PNG, and other image formats
                </p>
              </div>
              <Button variant="upload" size="lg">
                <FileImage className="w-5 h-5 mr-2" />
                Choose Files
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          {selectedFiles.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Selected Images ({selectedFiles.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {selectedFiles.slice(0, 6).map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg shadow-custom-md"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-lg truncate">
                      {file.name}
                    </div>
                  </div>
                ))}
                {selectedFiles.length > 6 && (
                  <div className="flex items-center justify-center h-24 bg-muted rounded-lg">
                    <span className="text-muted-foreground text-sm">
                      +{selectedFiles.length - 6} more
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button
            variant="gradient"
            size="xl"
            className="w-full mb-8"
            onClick={processImages}
            disabled={selectedFiles.length === 0 || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing Images...
              </>
            ) : (
              <>
                <FileImage className="w-5 h-5 mr-2" />
                Extract Recharge Codes
              </>
            )}
          </Button>

          {isProcessing && (
            <Card className="p-8 text-center bg-gradient-card border-border/50">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium text-foreground">
                Processing images and extracting codes...
              </p>
              <p className="text-muted-foreground mt-2">
                This may take a few moments depending on the number of images.
              </p>
            </Card>
          )}

          {isProcessed && !isProcessing && (
            <Card className="p-6 bg-gradient-card border-border/50">
              <div className="flex items-center mb-6">
                <Check className="w-6 h-6 text-success mr-2" />
                <h2 className="text-2xl font-bold text-foreground">Processing Complete</h2>
              </div>

              <p className="text-muted-foreground mb-6">
                Your images have been processed. Download the extracted codes in your preferred format.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={downloadTxt}
                  className="flex items-center justify-center"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Download as TXT
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={downloadExcel}
                  className="flex items-center justify-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download as Excel
                </Button>
              </div>
            </Card>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CodeExtractor;