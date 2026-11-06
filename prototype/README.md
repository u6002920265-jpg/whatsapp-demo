# Protótipo — exportação do snapshot

Pergunta: que forma deve ter o ecrã de revisão/exportação do snapshot do jogo, dentro do dashboard do WhatsApp?

Variantes (ficheiro autónomo, dados fictícios):

- **A · Mesa de revisão** — tabela densa + painel de snapshot fixo.
- **B · Triagem por cartões** — rail + um participante + cartões.
- **C · Assistente em 3 passos** — caixa de entrada + elenco + exportação.

Abrir `export-review.html`; trocar com `?variant=A|B|C`, a barra flutuante ou `←` `→`.

## Veredicto

**A · Mesa de revisão.** É a que dá ao anfitrião a vista completa das deteções e do elenco ao mesmo tempo, com o painel de exportação sempre à mão. A mesa é mais densa do que as outras, mas o trabalho é de auditoria: remover falsos positivos, ajustar gravidade e confirmar os 12 antes de gerar o ficheiro. A implementação de produção vive no ramo `feature/export-snapshot`, commit `92b6168`; só a variante A passou para o produto. As variantes B e C ficam aqui como fonte primária e não entram em `main`.
