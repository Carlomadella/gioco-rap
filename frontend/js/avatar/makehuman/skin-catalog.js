"use strict";

const COMMIT = "e5d1a42cb469025a6d2b3ecea3e0252e6feccc1f";

const RAW =
  `https://raw.githubusercontent.com/makehuman-js/makehuman-data/${COMMIT}/public/data/skins`;

const CDN =
  `https://cdn.jsdelivr.net/gh/makehuman-js/makehuman-data@${COMMIT}/public/data/skins`;

function urls(folder, filename) {
  return Object.freeze([
    `${RAW}/${folder}/textures/${filename}`,
    `${CDN}/${folder}/textures/${filename}`
  ]);
}

const BASE_TEXTURES = Object.freeze({
  light: Object.freeze({
    male: urls(
      "young_caucasian_male",
      "young_lightskinned_male_diffuse.png"
    ),
    female: urls(
      "young_caucasian_female",
      "young_lightskinned_female_diffuse.png"
    )
  }),

  medium: Object.freeze({
    male: urls(
      "young_asian_male",
      "young_lightskinned_male_diffuse3.png"
    ),
    female: urls(
      "young_asian_female",
      "young_lightskinned_female_diffuse3.png"
    )
  }),

  dark: Object.freeze({
    male: urls(
      "young_african_male",
      "young_darkskinned_male_diffuse.png"
    ),
    female: urls(
      "young_african_female",
      "young_darkskinned_female_diffuse.png"
    )
  })
});

function preset(id, label, textureFamily, tint) {
  const family = BASE_TEXTURES[textureFamily];

  return Object.freeze({
    id,
    label,
    textureFamily,
    tint,
    male: family.male,
    female: family.female
  });
}

/*
  V18.3: six YOUNG skin tones.
  The UI names tones only; source folder names are implementation details.

  Important:
  - no middle-age/old textures here;
  - age remains a separate future control;
  - only 3 texture families are downloaded, for both sexes = 6 cached images.
*/
export const MAKEHUMAN_SKIN_CATALOG = Object.freeze({
  porcelain: preset(
    "porcelain",
    "Molto chiara",
    "light",
    "#fff4ea"
  ),

  light: preset(
    "light",
    "Chiara",
    "light",
    "#ffffff"
  ),

  warm: preset(
    "warm",
    "Dorata",
    "medium",
    "#e6b08c"
  ),

  medium: preset(
    "medium",
    "Media",
    "medium",
    "#c99577"
  ),

  deep: preset(
    "deep",
    "Ambrata",
    "dark",
    "#ffffff"
  ),

  dark: preset(
    "dark",
    "Scura",
    "dark",
    "#c08062"
  )
});

export function getMakeHumanSkin(id) {
  return MAKEHUMAN_SKIN_CATALOG[id] || null;
}

export function listMakeHumanSkins() {
  return Object.values(MAKEHUMAN_SKIN_CATALOG);
}

export function listMakeHumanSkinTextureFamilies() {
  return Object.entries(BASE_TEXTURES).map(([id, family]) => ({
    id,
    ...family
  }));
}
