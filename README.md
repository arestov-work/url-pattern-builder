# url-pattern-builder

По образцу ссылки строит regex-правило показа. Вы даёте пример пути (например, `/blog/post`), выбираете, что в нём может меняться, а пакет собирает готовую регулярку, которой можно проверять другие ссылки.

Только чистая логика — без DOM, без зависимостей, без привязки к фреймворку. Функции работают одинаково в Astro, React, Vue, на бэкенде и в CLI. Интерфейс вы строите сами поверх этих функций.

## Установка

Пакет ставится напрямую из git-репозитория:

```bash
pnpm add github:ВАШ_НИК/url-pattern-builder
```

> При установке из git папка `dist` собирается автоматически (скрипт `prepare`), отдельная сборка не нужна.

Репозиторий приватный — доступ регулируется правами самого репозитория (коллаборатор, deploy-ключ или токен).

## Быстрый старт

Три функции работают по цепочке: срезать домен → разобрать путь → собрать regex.

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

## Функции

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

Возвращает объект `ParsedUrl`:

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

Каждый сегмент по умолчанию получает режим `exact` — вы меняете его сами перед сборкой regex (см. режимы сегментов ниже).

### `buildPattern(parsed: ParsedUrl, options?: BuildOptions): string`

Собирает строку регулярки из разобранного объекта и настроек. Второй аргумент необязателен — без него применяются значения по умолчанию.

```ts
buildPattern(parsed) // настройки по умолчанию
buildPattern(parsed, {
	pathLength: 'any', // с настройками
	tailMode: 'exists',
	tailParam: 'id',
})
```

Значения по умолчанию:

```ts
{ pathLength: 'exact', tailMode: 'ignore', tailParam: 'oid' }
```

## Режимы сегментов

Каждый сегмент пути (`segment.mode`) может совпадать по-разному. Меняйте `mode` у нужного сегмента перед вызовом `buildPattern`.

| Режим   | Что значит        | Пример regex-части        | Совпадает            |
| ------- | ----------------- | ------------------------- | -------------------- |
| `exact` | точное совпадение | `blog`                    | только `/blog`       |
| `any`   | любые символы     | `[^/?]+`                  | любой непустой кусок |
| `num`   | только числа      | `\d+`                     | `/123`, не `/abc`    |
| `alt`   | одно из значений  | `(?:blog\|news\|article)` | любое из списка      |

Для режима `alt` дополнительные значения берутся из `segment.alts` (массив строк) плюс основное `segment.value`.

```ts
const parsed = parseUrl('/blog/post')

// первый сегмент — одно из трёх, второй — только число
parsed.segments[0].mode = 'alt'
parsed.segments[0].alts = ['news', 'article']
parsed.segments[1].mode = 'num'

const pattern = buildPattern(parsed)
// → '^/(?:blog|news|article)/\\d+/?(?:\\?.*)?$'

const re = new RegExp(pattern)
re.test('/blog/12') // true
re.test('/news/7') // true
re.test('/article/99') // true
re.test('/shop/5') // false
```

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

```ts
const parsed = parseUrl('/blog/post')

buildPattern(parsed, {
	pathLength: 'exact',
	tailMode: 'ignore',
	tailParam: 'oid',
})
// '/blog/post/extra' → false

buildPattern(parsed, {
	pathLength: 'any',
	tailMode: 'ignore',
	tailParam: 'oid',
})
// '/blog/post/extra' → true
```

## Режимы хвоста (query после `?`)

Опция `tailMode` управляет проверкой query-параметров. Имя искомого параметра задаётся через `tailParam`.

| Режим    | Что значит                             | Пример                                |
| -------- | -------------------------------------- | ------------------------------------- |
| `ignore` | query не важен (что угодно или ничего) | `/blog` и `/blog?id=5` — оба подходят |
| `exists` | должен быть параметр с числом          | `?id=5` — да, `?id=abc` — нет         |
| `exact`  | точное значение параметра              | только `?id=5`, но не `?id=9`         |

```ts
const parsed = parseUrl('/blog?id=5')

// ignore — query не важен
buildPattern(parsed, {
	pathLength: 'exact',
	tailMode: 'ignore',
	tailParam: 'id',
})
// /blog → true, /blog?id=5 → true

// exists — параметр id обязателен и должен быть числом
buildPattern(parsed, {
	pathLength: 'exact',
	tailMode: 'exists',
	tailParam: 'id',
})
// /blog?id=5 → true, /blog?id=abc → false, /blog → false

// exact — ровно id=5
buildPattern(parsed, {
	pathLength: 'exact',
	tailMode: 'exact',
	tailParam: 'id',
})
// /blog?id=5 → true, /blog?id=9 → false
```

## Полный пример

Собрать правило: раздел `blog` или `news`, затем числовой id, путь ровно такой длины, обязательный параметр `oid` с числом.

```ts
import { stripDomain, parseUrl, buildPattern } from 'url-pattern-builder'

const path = stripDomain('https://site.com/blog/42?oid=100')
const parsed = parseUrl(path)

parsed.segments[0].mode = 'alt'
parsed.segments[0].alts = ['news']
parsed.segments[1].mode = 'num'

const pattern = buildPattern(parsed, {
	pathLength: 'exact',
	tailMode: 'exists',
	tailParam: 'oid',
})

const re = new RegExp(pattern)
re.test('/blog/42?oid=100') // true
re.test('/news/7?oid=3') // true
re.test('/blog/42') // false  (нет oid)
re.test('/blog/abc?oid=1') // false  (id не число)
```

## Экспортируемые типы

Пакет написан на TypeScript и отдаёт все типы для построения своего UI:

```ts
import type {
	Tail, // { name: string; value: string }
	Segment, // { value: string; mode: SegmentMode; alts: string[] }
	ParsedUrl, // { segments: Segment[]; hasTrailingSlash: boolean; tail: Tail | null }
	SegmentMode, // 'exact' | 'any' | 'num' | 'alt'
	PathLength, // 'exact' | 'any'
	TailMode, // 'ignore' | 'exists' | 'exact'
	BuildOptions, // { pathLength: PathLength; tailMode: TailMode; tailParam: string }
} from 'url-pattern-builder'
```
