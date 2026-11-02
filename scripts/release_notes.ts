/**
 * Prints the CHANGELOG section for a version, for the release workflow.
 * Usage: node scripts/release_notes.ts 1.0.0
 *
 * Run with --check to verify the section exists without printing it. The
 * release workflow calls that before publishing, so a missing heading fails
 * early instead of after the package is already on npm.
 */
import { readFile } from 'node:fs/promises'

const changelog_url = new URL('../CHANGELOG.md', import.meta.url)

const args = process.argv.slice(2)
const check_only = args.includes('--check')
const version = args.find(arg => !arg.startsWith('--'))

if (!version) {
   throw new Error('Usage: node scripts/release_notes.ts <version> [--check]')
}

const changelog = await readFile(changelog_url, 'utf8')
const lines = changelog.split('\n')

const start = lines.findIndex(line => line.startsWith(`## [${version}]`))

if (start === -1) {
   throw new Error(
      `No CHANGELOG section for ${version}. Move the Unreleased entries under "## [${version}]" before tagging.`,
   )
}

let end = lines.length

for (let index = start + 1; index < lines.length; index += 1) {
   const line = lines[index] ?? ''
   const is_next_section = line.startsWith('## [')
   const is_link_footer = /^\[[^\]]+\]: /.test(line)

   if (is_next_section || is_link_footer) {
      end = index
      break
   }
}

const body = lines.slice(start + 1, end).join('\n').trim()

if (check_only) {
   if (!body) {
      throw new Error(`The CHANGELOG section for ${version} is empty`)
   }
   process.stdout.write(`CHANGELOG has a ${version} section.\n`)
} else {
   process.stdout.write(`${body}\n`)
}
