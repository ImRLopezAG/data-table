import { createQueryCoreClient } from '@lib/trpc/query-client'
import { trpc } from '@lib/trpc/react'
import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { toast } from 'sonner'


export const todosCollection = createCollection(
  queryCollectionOptions({
    queryClient: createQueryCoreClient(),
    queryKey: trpc.proxy.todos.list.queryKey(),
    getKey: ({ id }) => id,
    queryFn: async () => await trpc.client.todos.list.query(),
    onUpdate: async ({ transaction }) => {
      const updates = transaction.mutations.map((m) => ({
        id: m.key,
        ...m.changes,
      }))
      for await (const update of updates) {
        await trpc.client.todos.updateTodo.mutate({
          id: update.id,
          data: {
            ...update,
          },
        })
        toast.success('Todo updated successfully')
      }
    },
    onInsert: async ({ transaction }) => {
      const inserts = transaction.mutations.map((m) => m.modified)
      for await (const insert of inserts) {
        await trpc.client.todos.createTodo.mutate({ ...insert })
      }
    },
    onDelete: async ({ transaction }) => {
      const deletes = transaction.mutations.map((m) => m.key)
      console.log('Deleting todos:', deletes)
      for await (const id of deletes) {
        await trpc.client.todos.deleteTodo.mutate(id)
      }
    },
  }),
)