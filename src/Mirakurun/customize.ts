/*!
 * Copyright (C) 2017 Kimura Youichi <kim.upsilon@bucyou.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @license AGPL-3.0
 */

"use strict";

import { TsChar } from "aribts";
import { EventState } from "./epg";

const fullwidthReplaceTable = {
    "０": "0", "１": "1", "２": "2", "３": "3", "４": "4",
    "５": "5", "６": "6", "７": "7", "８": "8", "９": "9", "　": " ",
    "Ａ": "A", "Ｂ": "B", "Ｃ": "C", "Ｄ": "D", "Ｅ": "E",
    "Ｆ": "F", "Ｇ": "G", "Ｈ": "H", "Ｉ": "I", "Ｊ": "J",
    "Ｋ": "K", "Ｌ": "L", "Ｍ": "M", "Ｎ": "N", "Ｏ": "O",
    "Ｐ": "P", "Ｑ": "Q", "Ｒ": "R", "Ｓ": "S", "Ｔ": "T",
    "Ｕ": "U", "Ｖ": "V", "Ｗ": "W", "Ｘ": "X", "Ｙ": "Y", "Ｚ": "Z",
    "ａ": "a", "ｂ": "b", "ｃ": "c", "ｄ": "d", "ｅ": "e",
    "ｆ": "f", "ｇ": "g", "ｈ": "h", "ｉ": "i", "ｊ": "j",
    "ｋ": "k", "ｌ": "l", "ｍ": "m", "ｎ": "n", "ｏ": "o",
    "ｐ": "p", "ｑ": "q", "ｒ": "r", "ｓ": "s", "ｔ": "t",
    "ｕ": "u", "ｖ": "v", "ｗ": "w", "ｘ": "x", "ｙ": "y", "ｚ": "z"
};

export function convertFullWidthToHalf(text: string): string {
    let result = "";

    for (let c of text) {
        const replacement = fullwidthReplaceTable[c];
        if (replacement !== undefined) {
            c = replacement;
        }

        result += c;
    }

    return result;
}

// 使ふとこだけ型定義する (aribts)
interface TsSectionEventInformation {
    version_number: number;
}
interface TsDescriptorExtendedEvent {
    descriptor_number: number;
    last_descriptor_number: number;
    items: {
        item_description_length: number;
        item_description_char: Buffer;
        item_length: number;
        item_char: Buffer;
    }[];
}

// 拡張形式イベント記述子 (ARIB STD-B10 5.8版 第2部 6.2.7, ARIB TR-B14 6.1版 第4編 31.3.2.11)
// https://github.com/upsilon/Mirakurun/commit/791101be から現行の Mirakurun に合はせて改変
export function updateEventStateExtended(state: EventState, eit: TsSectionEventInformation, d: TsDescriptorExtendedEvent) {
    if (state.extended.version !== eit.version_number) {
        state.extended._done = false;
        state.extended.version = eit.version_number;

        state.extended._descs = [];

        // descriptor_number は 0 から開始される
        for (let i = 0, l = d.last_descriptor_number; i <= l; i++) {
            state.extended._descs[i] = null;
        }
    }

    if (state.extended._descs[d.descriptor_number] !== null) {
        return;
    }

    state.extended._descs[d.descriptor_number] = d.items.map(x => ({
        // 項目名 (「番組内容」「出演者」など)
        item_description_length: x.item_description_length,
        item_description_char: x.item_description_char,

        // 項目記述
        item_length: x.item_length,
        item_char: x.item_char
    }));

    // state.extended._descs が全て埋まったら文字列に変換する
    if (state.extended._descs.every(x => x !== null)) {
        const longdesc_items: [Buffer, Buffer][] = [];

        for (const [descIndex, items] of state.extended._descs.entries()) {
            for (const item of items) {
                // 項目名が空文字列の場合は、item.item_char を一つ前の続きとして扱ふ
                // マルチバイト文字が分断されてゐる場合があるためこの時点では string にデコードできない
                if (item.item_description_length === 0 && longdesc_items.length !== 0) {
                    const before_item = longdesc_items[longdesc_items.length - 1];
                    before_item[1] = Buffer.concat([before_item[1], item.item_char]);
                    continue;
                }

                longdesc_items.push([item.item_description_char, item.item_char]);
            }
        }

        const extended: {[description: string]: string} = {};
        for (const item of longdesc_items) {
            const desc = new TsChar(item[0]).decode();
            const text = new TsChar(item[1]).decode();
            extended[desc] = text;
        }

        state.program.update({
            extended: extended
        });

        state.extended._done = true;
        state.extended._descs = [];
    }
}
