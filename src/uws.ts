/*
 * Authored by Alex Hultman, 2018-2024.
 * Intellectual property of third-party.

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

try {
  await import(`./uws_${process.platform}_${process.arch}_${process.versions.modules}.node`)
} catch (error) {
  throw new Error('This version of uWS.js supports only Node.js versions 18, 20, 21 and 22 on (glibc) Linux, macOS and Windows, on Tier 1 platforms (https://github.com/nodejs/node/blob/master/BUILDING.md#platform-list).\n\n' + error.toString())
}


export class DeclarativeResponse {
  instructions: number[]
  constructor() {
    this.instructions = []
  }

  // Utility method to encode text and append instruction
  _appendInstruction(opcode: number, ...text: string[]) {
    this.instructions.push(opcode)
    for (const str of text) {
      const bytes = (typeof str === 'string') ? new TextEncoder().encode(str) : str
      this.instructions.push(bytes.length, ...bytes)
    }
  }

  // Utility method to append 2-byte length text in little-endian format
  _appendInstructionWithLength(opcode: number, text: string) {
    this.instructions.push(opcode)
    const bytes = new TextEncoder().encode(text)
    const length = bytes.length
    this.instructions.push(length & 0xFF, (length >> 8) & 0xFF, ...bytes)
  }

  writeHeader(key: string, value: string) { return this._appendInstruction(1, key, value), this }
  writeBody() { return this.instructions.push(2), this }
  writeQueryValue(key: string) { return this._appendInstruction(3, key), this }
  writeHeaderValue(key: string) { return this._appendInstruction(4, key), this }
  write(value: string) { return this._appendInstructionWithLength(5, value), this }
  writeParameterValue(key: string) { return this._appendInstruction(6, key), this }

  end(value: string) {
    const bytes = new TextEncoder().encode(value)
    const length = bytes.length
    this.instructions.push(0, length & 0xFF, (length >> 8) & 0xFF, ...bytes)
    return new Uint8Array(this.instructions).buffer
  }
}
