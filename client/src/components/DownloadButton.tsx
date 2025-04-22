import React from "react";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DownloadButton = () => {
  const { toast } = useToast();
  
  const handleDownload = async () => {
    try {
      toast({
        title: "Preparando download",
        description: "Aguarde enquanto preparamos seu arquivo .zip...",
      });
      
      const response = await fetch("/api/download");
      
      if (!response.ok) {
        throw new Error("Falha ao baixar o arquivo");
      }
      
      // Criar um link temporário para o download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fintrack_project.zip";
      document.body.appendChild(a);
      a.click();
      
      // Limpar após o download
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download iniciado!",
        description: "Seu arquivo .zip está sendo baixado.",
      });
    } catch (error) {
      console.error("Erro ao baixar o projeto:", error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o projeto. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
      <Download size={16} />
      <span>Baixar projeto</span>
    </Button>
  );
};

export default DownloadButton;