export const REFRESHED_MONSTER_KEYS = ["m_ghost", "m_gear", "m_vine", "m_mud", "m_moss", "m_bat", "m_imp", "m_snake", "m_wisp", "m_guard", "m_jelly", "m_watcher"] as const;
export const REFRESHED_WEAPON_KEYS = ["w_secret_ember", "w_secret_tide", "w_secret_storm", "w_secret_frost", "w_secret_solar", "w_hero_sword", "w_hw_candy", "w_hw_lantern", "w_hw_bat", "w_hw_coffin", "w_hw_harvest", "w_hw_emedral", "w_rune_saber"] as const;
export const PAINTED_MENU_KEYS = ["ui_modal_frame", "ui_close_button", "ui_shop_header", "ui_gacha_header", "ui_settings_header"] as const;
export const ART_REFRESH = Object.fromEntries([...REFRESHED_MONSTER_KEYS, ...PAINTED_MENU_KEYS, ...REFRESHED_WEAPON_KEYS.map(key => `icon_${key}`)].map(key => [key, `assets/art-refresh-v1/${key}.png`]));
export function equipmentIconTexture(key: string) { return (REFRESHED_WEAPON_KEYS as readonly string[]).includes(key) ? `icon_${key}` : key; }


export const STAR_EQUIPMENT_BACKGROUND = 0xb65b1b;
export function equipmentIconFlipX(key: string) { return ['armor_dawn', 'armor_aqua', 'armor_crimson'].includes(key); }
