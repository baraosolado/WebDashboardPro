import React from "react";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WordPressDownloadButton = () => {
  const { toast } = useToast();
  
  const handleDownload = () => {
    toast({
      title: "Download iniciado",
      description: "O download do plugin WordPress está sendo iniciado...",
    });
    
    // Criar um link temporário e acionar o download
    window.location.href = "/download-wordpress-plugin";
  };
  
  return (
    <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
      <Download size={16} />
      <span>Plugin WordPress</span>
    </Button>
  );
};

export default WordPressDownloadButton;