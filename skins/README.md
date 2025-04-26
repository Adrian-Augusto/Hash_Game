# Como Adicionar Novas Skins

Para adicionar uma nova skin ao jogo, siga estes passos:

1. Adicione a imagem da skin na pasta `skins/`
   - Formatos suportados: PNG, JPG
   - Tamanho recomendado: 128x128 pixels
   - Fundo transparente recomendado

2. Edite o arquivo `skins.json` e adicione a configuração da sua skin:
```json
{
    "id": "sua-skin",          // ID único para a skin
    "name": "Nome da Skin",    // Nome que aparecerá no menu
    "color": "#HEXCOLOR",      // Cor principal em formato HEX
    "type": "free",           // "free" ou "premium"
    "glowColor": "rgba(r,g,b,a)", // Cor do brilho com transparência
    "path": "skins/sua-skin.png"  // Caminho para a imagem
}
```

3. A skin aparecerá automaticamente no seletor de skins do menu inicial

## Exemplo de Configuração

```json
{
    "id": "rainbow",
    "name": "Rainbow Glow",
    "color": "#ff4081",
    "type": "premium",
    "glowColor": "rgba(255, 64, 129, 0.5)",
    "path": "skins/rainbow.png"
}
``` 