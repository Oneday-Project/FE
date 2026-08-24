import { defineConfig, loadEnv } from 'vite'
import type { Plugin, ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'

function anthropicProxyPlugin(): Plugin {
  return {
    name: 'anthropic-proxy',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/claude', async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY

        if (!apiKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: 'Anthropic API key is missing. Set ANTHROPIC_API_KEY in your environment.',
          }))
          return
        }

        try {
          let body: any = {}
          const chunks: Buffer[] = []

          for await (const chunk of req) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          }

          if (chunks.length > 0) {
            const raw = Buffer.concat(chunks).toString('utf-8')
            body = raw ? JSON.parse(raw) : {}
          }

          const messages = Array.isArray(body.messages) ? body.messages : [{ role: 'user', content: String(body.prompt || '') }]
          const model = body.model || 'claude-3-5-sonnet-20241022'
          const maxTokens = Number(body.max_tokens ?? 1024)

          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model,
              max_tokens: Number.isFinite(maxTokens) ? maxTokens : 1024,
              messages,
            }),
          })

          const data: any = await response.json().catch(() => ({}))

          if (!response.ok) {
            res.statusCode = response.status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              error: data?.error?.message || 'Claude request failed',
              details: data,
            }))
            return
          }

          const text = data?.content?.map((block: any) => block?.text ?? '').join('\n\n') || ''

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            answer: text,
            raw: data,
          }))
        } catch (error) {
          console.error('Claude proxy error:', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown Claude proxy error',
          }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), anthropicProxyPlugin()],

    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:3000',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        },
      },
    },
  }
})