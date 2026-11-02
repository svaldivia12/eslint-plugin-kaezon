/**
 * Prints the CHANGELOG section for a version, for the release workflow.
 * Usage: node scripts/release_notes.js 1.0.0
 */
import { readFile } from 'node:fs/promises'

const changelog_url = new URL('../CHANGELOG.md', import.meta.url)

const version = process.argv[2]

if (!version) {
   throw new Error('Usage: node scripts/release_notes.js <version>')
}

const changelog = await readFile(changelog_url, 'utf8')
const lines = changelog.split('\n')

const start = lines.findIndex(line => line.startsWith(`## [${version}]`))

if (start === -1) {
   throw new Error(`No CHANGELOG section for ${version}`)
}

let end = lines.length

for (let index = start + 1; index < lines.length; index += 1) {
   const is_next_section = lines[index].startsWith('## [')
   const is_link_footer = /^\[[^\]]+\]: /.test(lines[index])

   if (is_next_section || is_link_footer) {
      end = index
      break
   }
}

process.stdout.write(`${lines.slice(start + 1, end).join('\n').trim()}\n`)
