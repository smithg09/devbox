export const demoMdFile = `
# Title Header (H1 header)


### Introduction (H3 header)

This is some placeholder text to show examples of Markdown formatting.


## Basic Markdown

This is _italics_, this is **bold**, this is __underline__, and this is ~~strikethrough~~.

- This is a list item.
- This list is unordered.

1. This is a list item.
2. This list is ordered.

> This is a quote.
>
> > This is a quote inside a quote.
>
> - This is a list in a quote.
> - Another item in the quote list.

---
<!-- Comments will be removed from the output -->

| Tables | are   | also  | supported |
|--------|-------|-------|-----------|
| col 1  | col 2 | col 3 | col 4     |
| col 1  | col 2 | col 3 | col 4     |
| col 1  | col 2 | col 3 | col 4     |
| col 1  | col 2 | col 3 | col 4     |
| col 1  | col 2 | col 3 | col 4     |


## Code

This is \`inline code\`. This is a <^>variable<^>. This is an \` in -line code <^> variable <^> \`. You can also have [\`code\` in links](https://www.digitalocean.com).

Here's a configuration file with a label:


\`\`\`nginx
[label / etc / nginx / sites - available /default]
server {
    listen 80 <^> default_server <^>;
    . . .
}
\`\`\`

## Mics
A foot note[^1]

[^1]: footnote content.

* [ ] to do
* [x] done

## Math
$\\frac{-30}{8}$

$$
L = \\frac{1}{2} \\rho v^2 S C_L
$$

<div class="math math-display">
  L = \\frac{1}{2} \\rho v^2 S C_L
</div>
`;
