import client from '@client/renderer'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import server from '@/server'

const app = new Hono()

app.use('*', logger())

app.route('/api', server)

app.route('/', client)

export default app
