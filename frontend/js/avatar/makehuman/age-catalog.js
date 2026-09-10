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

function family(light, medium, dark) {
  return Object.freeze({
    light: Object.freeze(light),
    medium: Object.freeze(medium),
    dark: Object.freeze(dark)
  });
}

/*
  Età/aspetto is independent from skin tone.

  Each age group exposes the same three source texture families:
  - light
  - medium
  - dark

  The six UI skin tones keep using their existing tint values on top.
*/
export const MAKEHUMAN_AGE_CATALOG = Object.freeze({
  young: Object.freeze({
    id: "young",
    label: "Giovane",
    textures: Object.freeze({
      male: family(
        urls(
          "young_caucasian_male",
          "young_lightskinned_male_diffuse.png"
        ),
        urls(
          "young_asian_male",
          "young_lightskinned_male_diffuse3.png"
        ),
        urls(
          "young_african_male",
          "young_darkskinned_male_diffuse.png"
        )
      ),
      female: family(
        urls(
          "young_caucasian_female",
          "young_lightskinned_female_diffuse.png"
        ),
        urls(
          "young_asian_female",
          "young_lightskinned_female_diffuse3.png"
        ),
        urls(
          "young_african_female",
          "young_darkskinned_female_diffuse.png"
        )
      )
    })
  }),

  middle: Object.freeze({
    id: "middle",
    label: "Mezza età",
    textures: Object.freeze({
      male: family(
        urls(
          "middleage_caucasian_male",
          "middleage_lightskinned_male_diffuse.png"
        ),
        urls(
          "middleage_asian_male",
          "middleage_lightskinned_male_diffuse2.png"
        ),
        urls(
          "middleage_african_male",
          "middleage_darkskinned_male_diffuse.png"
        )
      ),
      female: family(
        urls(
          "middleage_caucasian_female",
          "middleage_lightskinned_female_diffuse.png"
        ),
        urls(
          "middleage_asian_female",
          "middleage_lightskinned_female_diffuse2.png"
        ),
        urls(
          "middleage_african_female",
          "middleage_darkskinned_female_diffuse.png"
        )
      )
    })
  }),

  old: Object.freeze({
    id: "old",
    label: "Anziano",
    textures: Object.freeze({
      male: family(
        urls(
          "old_caucasian_male",
          "old_lightskinned_male_diffuse.png"
        ),
        urls(
          "old_asian_male",
          "old_lightskinned_male_diffuse2.png"
        ),
        urls(
          "old_african_male",
          "old_darkskinned_male_diffuse.png"
        )
      ),
      female: family(
        urls(
          "old_caucasian_female",
          "old_lightskinned_female_diffuse.png"
        ),
        urls(
          "old_asian_female",
          "old_lightskinned_female_diffuse2.png"
        ),
        urls(
          "old_african_female",
          "old_darkskinned_female_diffuse.png"
        )
      )
    })
  })
});

export function getMakeHumanAge(id) {
  return MAKEHUMAN_AGE_CATALOG[id] || null;
}

export function listMakeHumanAges() {
  return Object.values(MAKEHUMAN_AGE_CATALOG);
}
