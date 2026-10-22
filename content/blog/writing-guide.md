---
title: "Writing guide: everything a post can do"
date: 2026-10-23
summary: "A reference post showing frontmatter, code, math, tables, images, and footnotes. It is a draft, so it never ships."
tags: ["Meta"]
draft: true
---

This post is a cheat sheet. It is marked `draft: true`, so it appears in `pnpm dev` and is left out of the production build. Copy it to start a new post, or delete it once you no longer need it.

## Starting a post

Create `content/blog/<slug>.md`. The file name becomes the URL, so `world-models-at-test-time.md` is served at `/blog/world-models-at-test-time/`. Use lowercase words joined by hyphens.

Every post starts with frontmatter:

```yaml
---
title: "What test-time adaptation actually buys a planner"
date: 2026-10-23          # shown on the post and used for ordering
summary: "One sentence. Shown on cards, in search results, and in the RSS feed."
tags: ["JEPA", "World models"]
updated: 2026-11-02       # optional
draft: true               # optional: remove this line to publish
---
```

The build fails with a clear message if `title`, `date`, or `summary` is missing, so a broken post cannot ship by accident.

## Text

Regular **Markdown** works: *emphasis*, `inline code`, [links](https://arxiv.org), and ~~strikethrough~~.

> Blockquotes are good for pulling out a claim from a paper you are discussing.

- Bullet lists
- [x] and task lists
- [ ] from GitHub-flavoured Markdown

## Code

Fenced code blocks are highlighted at build time, and the colours follow the site theme toggle.

```python
import torch

def grpo_advantages(rewards: torch.Tensor) -> torch.Tensor:
    # rewards: (num_prompts, group_size)
    mean = rewards.mean(dim=1, keepdim=True)
    std = rewards.std(dim=1, keepdim=True)
    return (rewards - mean) / (std + 1e-6)
```

## Math

Inline math goes between single dollar signs: the KL penalty $\beta \, \mathrm{KL}(\pi_\theta \,\|\, \pi_{\text{ref}})$.

Display math goes between double dollar signs:

$$
\max_{\theta} \; \mathbb{E}_{x \sim \mathcal{D},\, y \sim \pi_\theta(\cdot \mid x)} \big[ r(x, y) \big] - \beta \, \mathrm{KL}\big(\pi_\theta(\cdot \mid x) \,\|\, \pi_{\text{ref}}(\cdot \mid x)\big)
$$

## Tables

| Condition       | Frozen | Adapted | p     |
| --------------- | -----: | ------: | ----: |
| Held-out shapes |    24% |     40% | 0.039 |
| Visual shift    |    62% |     80% | 0.022 |

Wide tables scroll sideways on phones instead of breaking the layout.

## Images and video

Put files in `public/images/blog/<slug>/` and reference them from the site root:

```markdown
![Success rate against adaptation steps](/images/blog/my-post/success-rate.png)
```

Raw HTML also works, which helps for figures with captions or short rollout videos:

```html
<figure>
  <video src="/images/blog/my-post/rollout.mp4" controls muted playsinline></video>
  <figcaption>Adapted planner on the red-block shift.</figcaption>
</figure>
```

## Footnotes

Footnotes keep asides out of the main argument.[^1]

[^1]: They render at the bottom of the post with a link back.
