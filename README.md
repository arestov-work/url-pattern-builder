# url-pattern-builder

По образцу ссылки строит regex-правило показа. Вы даёте пример пути (например, `/blog/post`), выбираете, что в нём может меняться, а пакет собирает готовую регулярку, которой можно проверять другие ссылки.

Только чистая логика — без DOM, без зависимостей, без привязки к фреймворку. Функции работают одинаково в Astro, React, Vue, на бэкенде и в CLI. Интерфейс вы строите сами поверх этих функций.

## Установка

Пакет ставится напрямую из git-репозитория:

```bash
pnpm add github:ВАШ_НИК/url-pattern-builder
```

> При установке из git папка `dist` собирается автоматически (скрипт `prepare`), отдельная сборка не нужна.

## Обзор

Функции делятся на две группы.

**Разбор и сборка** — базовая цепочка «ссылка → regex»:

- `stripDomain(url)` — срезать домен, оставить путь
- `parseUrl(url)` — разобрать путь на части
- `buildPattern(parsed, options?)` — собрать строку regex

**Логика конструктора** — для интерактивного UI, где пользователь настраивает правило кликами:

- `createInitialState(url)` — из ссылки собрать начальное состояние
- `setSegmentMode` / `setSegmentValue` — менять сегмент
- `addAlt` / `setAlt` / `removeAlt` — менять значения режима «или»
- `matches(parsed, options, url)` — подходит ли ссылка под правило
- `hasTail(parsed)` — есть ли в ссылке параметр после «?»
- `isValidPattern(pattern)` — корректна ли строка regex

Плюс данные `SEGMENT_MODES` (список режимов с подписями) и все TypeScript-типы.

## Быстрый старт

Три базовые функции работают по цепочке: срезать домен → разобрать путь → собрать regex.

```ts
import { stripDomain, parseUrl, buildPattern } from 'url-pattern-builder'

const path = stripDomain('https://site.com/blog/post/?id=5')
// → '/blog/post/?id=5'

const parsed = parseUrl(path)
// → { segments: [...], hasTrailingSlash: true, tail: { name: 'id', value: '5' } }

const pattern = buildPattern(parsed)
// → '^/blog/post/?(?:\\?.*)?$'

// проверяем другие ссылки этой регуляркой
const re = new RegExp(pattern)
re.test('/blog/post') // true
re.test('/other') // false
```

## Разбор и сборка

### `stripDomain(raw: string): string`

Срезает схему и домен, оставляя только путь начиная с `/`. Если доменной части нет — возвращает ввод как есть.

```ts
stripDomain('https://site.com/blog') // '/blog'
stripDomain('www.site.com/blog') // '/blog'
stripDomain('/blog/post') // '/blog/post'  (уже путь)
stripDomain('blog') // 'blog'        (не домен, не трогаем)
```

### `parseUrl(raw: string): ParsedUrl`

Разбирает путь на части. На вход ожидает уже очищенный путь (результат `stripDomain`).

```ts
parseUrl('/blog/post/?id=5')
// {
//   segments: [
//     { value: 'blog', mode: 'exact', alts: [] },
//     { value: 'post', mode: 'exact', alts: [] }
//   ],
//   hasTrailingSlash: true,
//   tail: { name: 'id', value: '5' }
// }
```

Каждый сегмент по умолчанию получает режим `exact` — вы меняете его сами перед сборкой regex.

### `buildPattern(parsed: ParsedUrl, options?: BuildOptions): string`

Собирает строку регулярки из разобранного объекта и настроек. Второй аргумент необязателен — без него применяются значения по умолчанию.

```ts
buildPattern(parsed) // настройки по умолчанию
buildPattern(parsed, {
	pathLength: 'any',
	tailMode: 'exists',
	tailParam: 'id',
})
```

Значения по умолчанию:

```ts
{ pathLength: 'exact', tailMode: 'ignore', tailParam: 'oid' }
```

## Логика конструктора

Эти функции нужны, когда вы строите интерактивный UI. Все операции с сегментами **чистые**: принимают текущий массив и возвращают новый, ничего не мутируя — это удобно для React-состояния.

### `createInitialState(url: string): ConstructorState`

Из ссылки собирает начальное состояние конструктора: разбирает путь, определяет хвост и режим по умолчанию. Заменяет ручной разбор при вводе ссылки.

```ts
createInitialState('/blog/post/?id=5')
// {
//   segments: [ { value: 'blog', mode: 'exact', alts: [] }, ... ],
//   tail: { name: 'id', value: '5' },
//   tailMode: 'exists',   // есть параметр → 'exists', иначе 'ignore'
//   tailParam: 'id'       // имя параметра из ссылки, иначе 'oid'
// }
```

### Операции с сегментами

Каждая принимает массив сегментов и индекс, возвращает **новый** массив.

```ts
import {
	setSegmentMode,
	setSegmentValue,
	addAlt,
	setAlt,
	removeAlt,
} from 'url-pattern-builder'

// сменить режим сегмента №1 на 'num'
const next = setSegmentMode(segments, 1, 'num')

// изменить значение сегмента №0
setSegmentValue(segments, 0, 'catalog')

// работа с режимом «или» (alt)
addAlt(segments, 0) //             + пустое поле «или»
setAlt(segments, 0, 1, 'news') //  задать 2-е значение «или»
removeAlt(segments, 0, 1) //       убрать 2-е значение «или»
```

Особенность `setSegmentMode`: при переключении на `alt` он сам добавляет одно пустое поле, если их ещё нет — чтобы пользователю было куда вписать альтернативу.

### `matches(parsed: ParsedUrl, options: BuildOptions, url: string): boolean`

Собирает regex из состояния и проверяет, подходит ли под него ссылка. Внутри ловит ошибки некорректного regex и в этом случае возвращает `false` — можно звать безопасно.

```ts
matches(
	parsed,
	{ pathLength: 'exact', tailMode: 'ignore', tailParam: 'oid' },
	'/blog/post',
)
// true | false
```

### `hasTail(parsed: ParsedUrl): boolean`

Есть ли в разобранной ссылке параметр после «?». Удобно, чтобы решать, показывать ли в UI блок настройки хвоста.

```ts
hasTail(parseUrl('/blog?id=5')) // true
hasTail(parseUrl('/blog')) // false
```

### `isValidPattern(pattern: string): boolean`

Проверяет, что строка — корректное регулярное выражение (конструктор `RegExp` не бросает ошибку).

```ts
isValidPattern('^/blog/\\d+$') // true
isValidPattern('^/blog/(') // false — незакрытая скобка
```

## Режимы сегментов

Каждый сегмент пути (`segment.mode`) может совпадать по-разному.

| Режим   | Что значит        | Пример regex-части        | Совпадает            |
| ------- | ----------------- | ------------------------- | -------------------- |
| `exact` | точное совпадение | `blog`                    | только `/blog`       |
| `any`   | любые символы     | `[^/?]+`                  | любой непустой кусок |
| `num`   | только числа      | `\d+`                     | `/123`, не `/abc`    |
| `alt`   | одно из значений  | `(?:blog\|news\|article)` | любое из списка      |

Для режима `alt` дополнительные значения берутся из `segment.alts` (массив строк) плюс основное `segment.value`.

Готовый список режимов с человеческими подписями экспортируется как `SEGMENT_MODES` — удобно для построения UI:

```ts
import { SEGMENT_MODES } from 'url-pattern-builder'
// [
//   { id: 'exact', label: 'точное совпадение' },
//   { id: 'any',   label: 'любые символы' },
//   { id: 'num',   label: 'только числа' },
//   { id: 'alt',   label: 'или' },
// ]
```

## Длина пути

Опция `pathLength` управляет тем, подходят ли более длинные пути.

| Значение | Что значит                            | `/blog/post/extra` |
| -------- | ------------------------------------- | ------------------ |
| `exact`  | ровно столько же частей, что в ссылке | не подходит        |
| `any`    | разрешены вложенные `/части/`         | подходит           |

## Режимы хвоста (query после `?`)

Опция `tailMode` управляет проверкой query-параметров. Имя искомого параметра задаётся через `tailParam`.

| Режим    | Что значит                             | Пример                                |
| -------- | -------------------------------------- | ------------------------------------- |
| `ignore` | query не важен (что угодно или ничего) | `/blog` и `/blog?id=5` — оба подходят |
| `exists` | должен быть параметр с числом          | `?id=5` — да, `?id=abc` — нет         |
| `exact`  | точное значение параметра              | только `?id=5`, но не `?id=9`         |

## Пример: сборка UI на React

Логика вся в пакете — компонент только хранит состояние и дёргает функции.

```tsx
import { useState } from 'react'
import {
	createInitialState,
	setSegmentMode,
	buildPattern,
	matches,
	SEGMENT_MODES,
} from 'url-pattern-builder'
import type { ConstructorState, SegmentMode } from 'url-pattern-builder'

function Builder() {
	const [state, setState] = useState<ConstructorState>({
		segments: [],
		tail: null,
		tailMode: 'ignore',
		tailParam: 'oid',
	})

	// при вводе ссылки — пакет собирает начальное состояние
	function onUrl(url: string) {
		setState(createInitialState(url))
	}

	// клик по кнопке режима — пакет возвращает новые сегменты
	function onMode(i: number, mode: SegmentMode) {
		setState((s) => ({ ...s, segments: setSegmentMode(s.segments, i, mode) }))
	}

	const options = {
		pathLength: 'exact' as const,
		tailMode: state.tailMode,
		tailParam: state.tailParam,
	}

	const pattern = buildPattern(state, options)
	const ok = matches(state, options, '/blog/12')

	// ...разметка выдаёт SEGMENT_MODES кнопками и показывает pattern
}
```

## Экспортируемые типы

Пакет написан на TypeScript и отдаёт все типы для построения своего UI:

```ts
import type {
	Tail, // { name: string; value: string }
	Segment, // { value: string; mode: SegmentMode; alts: string[] }
	ParsedUrl, // { segments: Segment[]; hasTrailingSlash: boolean; tail: Tail | null }
	ConstructorState, // { segments: Segment[]; tail: Tail | null; tailMode: TailMode; tailParam: string }
	SegmentMode, // 'exact' | 'any' | 'num' | 'alt'
	PathLength, // 'exact' | 'any'
	TailMode, // 'ignore' | 'exists' | 'exact'
	BuildOptions, // { pathLength: PathLength; tailMode: TailMode; tailParam: string }
} from 'url-pattern-builder'
```
