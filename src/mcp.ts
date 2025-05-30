import { commitSchema, fakeCommits } from '@/services/commit';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpAgent } from 'agents/mcp';
import { z } from 'zod';

const commits = fakeCommits(20);
export class CommitServer extends McpAgent {
  server = new McpServer({
    name: 'Test Agent',
    version: '0.0.1',
  })

  async init() {


    this.server.tool('read_data', 'List a fake commits for testing', async () => {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(commits.map(commit => commitSchema.parse(commit)), null, 2),
        }]
      }
    })
    this.server.tool('read_data_partial', 'List a fake commits for testing', {
      query: z.object({
        count: z.number()
      }).optional(),
    }, async ({ query }) => {
      const count = query?.count ?? 10;
      const data = commits.slice(0, count).map(commit => commitSchema.parse(commit));

      return {
        content: [{
          type: 'text',
          text: `Partial commit data: ${JSON.stringify(data, null, 2)}, Total commits: ${commits.length}.`,
        }]
      }
    })

    this.server.tool('add_data', 'Add a fake commit for testing', {
      body: commitSchema,
    }, async ({ body }) => {
      const commit = commitSchema.parse(body);
      commits.push(commit);
      return {
        content: [{
          type: 'text',
          text: `Added commit with hash ${commit.hash}. Total commits: ${commits.length}.`,
        }]
      }
    })

    this.server.tool('get_data', 'Get a fake commit by hash', {
      params: z.object({
        hash: z.string(),
      }),
    }, async ({ params }) => {
      const commit = commits.find(c => c.hash === params.hash);
      if (!commit) {
        return {
          content: [{
            type: 'text',
            text: `Commit with hash ${params.hash} not found.`,
          }]
        }
      }
      return {
        content: [{
          type: 'text',
          text: `Found commit: ${JSON.stringify(commit)}`,
        }]
      }
    })

    this.server.tool('delete_data', 'Delete a fake commit by hash', {
      params: z.object({
        hash: z.string(),
      }),
    }, async ({ params }) => {
      const index = commits.findIndex(c => c.hash === params.hash);
      if (index === -1) {
        return {
          content: [{
            type: 'text',
            text: `Commit with hash ${params.hash} not found.`,
          }]
        }
      }
      commits.splice(index, 1);
      return {
        content: [{
          type: 'text',
          text: `Deleted commit with hash ${params.hash}. Remaining commits: ${commits.length}.`,
        }]
      }
    })
    this.server.tool('update_data', 'Update a fake commit by hash', {
      params: z.object({
        hash: z.string(),
      }),
      body: commitSchema,
    }, async ({ params, body }) => {
      const index = commits.findIndex(c => c.hash === params.hash);
      if (index === -1) {
        return {
          content: [{
            type: 'text',
            text: `Commit with hash ${params.hash} not found.`,
          }]
        }
      }
      const updatedCommit = commitSchema.parse(body);
      commits[index] = updatedCommit;
      return {
        content: [{
          type: 'text',
          text: `Updated commit with hash ${params.hash}.`,
        }]
      }
    }
    );
  }
}