# Web logo and language settings

- Web source: C:\chari-dungeon-release-final
- The title and opening use public/assets/ui/brand-v1/chari-desktop-logo.png, copied from the desktop game’s Chari logo.
- Default language is Japanese. Switch with the title’s 日本語 / English button or the language row in Settings while playing.
- Browser preference: chari-dungeon.language.v1. Language is independent of adventure saves.
- src/i18n.ts localizes Phaser Text at the display boundary. Original Japanese text is retained for live switching; destroyed text objects are removed from the registry.
- src/localeEnglish.ts contains English display strings. src/localeTemplates.ts translates dynamic messages and retains numbers and names.
- Row labels and compact logs are fitted after translation without discarding their original text.
- To add text: add an explicit full-string translation; add a numbered-placeholder template for messages with runtime values. Unregistered strings retain their source text.
- Validation: npm run build; scripts/qa-language.cjs with Playwright (NODE_PATH pointing to the bundled runtime packages if needed). Screenshots in outputs/qa-language.
- QA covers title logo, persistent language, switching during an adventure without changing player/floor/turn, item names, dynamic chest messages, Mystery Bread messages, and desktop/mobile controls.
- These changes are local. GitHub Pages publishing is a separate step.
