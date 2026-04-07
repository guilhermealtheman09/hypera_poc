Hypera Conferência — POC
📌 Objetivo

POC para validar uma aplicação de conferência de embarque em coletor, focando em:

navegação entre telas (sem uso de modal)
renderização e performance
experiência comparada ao ITS Mobile
🏗️ Tecnologias
SAPUI5 (Freestyle)
SAP CAP (Node.js)
OData V4
🔄 Fluxo
Login
Lista de remessas/paletes
Detalhe do item
Conferência
Resultado (nova tela)
⚙️ Regras
Conferência por palete
Comparação: contado vs esperado
Até 3 tentativas
Persistindo divergência → caixa por caixa
Supervisor pode aprovar
📂 Estrutura
db/   → modelo de dados  
srv/  → regras de negócio  
app/  → interface (SAPUI5)  
