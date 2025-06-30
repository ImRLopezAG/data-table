import server from '@/server'
import client from '@client/renderer'
import { Hono } from 'hono'
import { logger } from 'hono/logger'

const app = new Hono()

app.use('*', logger())

app.route('/api', server)

app.route('/', client)

export default app
