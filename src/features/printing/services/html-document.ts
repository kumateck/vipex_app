export function createPrintableHtmlDocument(input: {
  title: string;
  bodyHtml: string;
  pageStyle?: string;
}) {
  const { title, bodyHtml, pageStyle } = input;

  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      ${pageStyle ?? ''}
    </style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`;
}
