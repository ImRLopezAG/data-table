import server from '@/server'
import client from '@client/renderer'
import { Hono } from 'hono'
import { logger } from 'hono/logger'

const app = new Hono()

app.use('*', logger())



app.route('/', client)
app.route('/api', server)

export default app
