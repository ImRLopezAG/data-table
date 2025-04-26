import { Hono } from 'hono';
import { renderToString } from 'react-dom/server';
const client = new Hono<{ Bindings: CloudflareBindings }>();

client.get('/', ({ req, ...c }) => {
  const { url } = req;
  const { origin } = new URL(url);
  const injectClientScript = `
    import RefreshRuntime from "${origin}/@react-refresh";
    RefreshRuntime.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => (type) => type;
    window.__vite_plugin_react_preamble_installed__ = true;
  `;
  const styles = import.meta.env.PROD ? '/assets/style.css' : '/src/style.css';
  const script = import.meta.env.PROD ? '/index.js' : '/src/frontend.tsx';

  const html = `
	<html lang="en">
		<head>
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<link rel="icon" type="image/svg+xml" href="/favicon.ico" />
			<link
				href="${styles}"
				rel="stylesheet"
			/>
			<title>Data Table</title>
			${import.meta.env.DEV &&  `<script type="module">${injectClientScript}</script>`}
		</head>
		<body>
			<div id="root"></div>
			<script type="module" src="${script}"></script>
		</body>
	</html>
	`;

  return c.html(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store',
    },
  });
});

export default client;