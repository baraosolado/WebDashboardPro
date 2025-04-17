import { useState, useRef, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export default function AppearanceSettings() {
  const { themeConfig, updateThemeConfig } = useTheme();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formValues, setFormValues] = useState({
    appName: themeConfig.appName,
    primaryColor: themeConfig.primaryColor,
    logoPreview: themeConfig.logoUrl,
  });

  // Manipular mudança do nome do app
  const handleAppNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      appName: e.target.value,
    });
  };

  // Manipular mudança da cor primária
  const handleColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      primaryColor: e.target.value,
    });
  };

  // Abrir seletor de arquivo ao clicar no botão
  const handleChooseLogoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Manipular arquivo de logo selecionado
  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione uma imagem.",
          variant: "destructive",
        });
        return;
      }

      // Verificar tamanho do arquivo (máx 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 2MB.",
          variant: "destructive",
        });
        return;
      }

      // Converter para URL de dados
      const reader = new FileReader();
      reader.onload = (event) => {
        const logoUrl = event.target?.result as string;
        setFormValues({
          ...formValues,
          logoPreview: logoUrl,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Aplicar alterações
  const handleApplyChanges = () => {
    updateThemeConfig({
      appName: formValues.appName,
      primaryColor: formValues.primaryColor,
      logoUrl: formValues.logoPreview,
    });

    toast({
      title: "Configurações atualizadas",
      description: "As alterações de aparência foram aplicadas com sucesso.",
    });
  };

  // Remover logo
  const handleRemoveLogo = () => {
    setFormValues({
      ...formValues,
      logoPreview: null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="app-name">Nome do Aplicativo</Label>
        <Input
          id="app-name"
          value={formValues.appName}
          onChange={handleAppNameChange}
          placeholder="Nome do seu aplicativo"
        />
        <p className="text-xs text-gray-500">
          Este nome será exibido no cabeçalho e título da página.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="primary-color">Cor Principal</Label>
        <div className="flex items-center gap-3">
          <Input
            id="primary-color"
            type="color"
            value={formValues.primaryColor}
            onChange={handleColorChange}
            className="w-16 h-10 p-1"
          />
          <Input
            value={formValues.primaryColor}
            onChange={handleColorChange}
            className="font-mono"
          />
        </div>
        <p className="text-xs text-gray-500">
          Esta cor será usada no cabeçalho e elementos principais do site.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Logo do Aplicativo</Label>
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 border rounded flex items-center justify-center bg-gray-50"
            style={{ borderColor: formValues.primaryColor }}
          >
            {formValues.logoPreview ? (
              <img 
                src={formValues.logoPreview} 
                alt="Logo preview" 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-gray-400">Sem logo</span>
            )}
          </div>
          <div className="space-x-2">
            <Button type="button" variant="outline" onClick={handleChooseLogoClick}>
              Escolher Imagem
            </Button>
            {formValues.logoPreview && (
              <Button type="button" variant="outline" onClick={handleRemoveLogo}>
                Remover
              </Button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          A logo será exibida ao lado do nome do aplicativo no cabeçalho.
          Recomendamos uma imagem quadrada de pelo menos 64x64 pixels.
        </p>
      </div>

      <div className="pt-4 border-t">
        <p className="text-sm text-gray-500 mb-4">
          <strong>Observação:</strong> O rodapé sempre exibirá o nome "FinTrack" com os direitos de autor.
        </p>
        <Button onClick={handleApplyChanges}>
          Aplicar Alterações
        </Button>
      </div>
    </div>
  );
}