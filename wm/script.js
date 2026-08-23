(() => {
  const heroVideo = document.querySelector("#hero-video");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const demoVideos = [...document.querySelectorAll(".demo-video")];
  const gradioRuns = [
    ["abandoned_room_toy_car", "run_0045_abandoned_room_toy_car", "abandoned_room_toy_car.mp4"],
    ["alien_cavern_winged_rider", "run_0008_alien_cavern_winged_rider", "alien_cavern_winged_rider.mp4"],
    ["ancient_overgrown_architectural_complex_tiered", "run_0008_ancient_overgrown_architectural_complex_tiered", "ancient_overgrown_architectural_complex_tiered.mp4"],
    ["bioluminescent_forest_dragon_fpv", "run_0014_bioluminescent_forest_dragon_fpv", "bioluminescent_forest_dragon_fpv.mp4"],
    ["cosmic_void_framed_swirling_accretion", "run_0017_cosmic_void_framed_swirling_accretion", "cosmic_void_framed_swirling_accretion.mp4"],
    ["cyberpunk_portal_city", "run_0006_cyberpunk_portal_city", "cyberpunk_portal_city.mp4"],
    ["deep_blue_sky_vast_rocket", "run_0004_deep_blue_sky_vast_rocket", "deep_blue_sky_vast_rocket.mp4"],
    ["densely_built_urban_street_multi", "run_0022_densely_built_urban_street_multi", "densely_built_urban_street_multi.mp4"],
    ["desert_dunes_horse_rider", "run_0005_desert_dunes_horse_rider", "desert_dunes_horse_rider.mp4"],
    ["desolate_snow_covered_alien_landscape", "run_0006_desolate_snow_covered_alien_landscape", "desolate_snow_covered_alien_landscape.mp4"],
    ["e2e_30s_car_alien_planet", "e2e_30s_car_alien_planet", "barren_cracked_rocky_extraterrestrial_landscape_3seg.mp4"],
    ["epic_cinematic_science_fiction_vast", "run_0002_epic_cinematic_science_fiction_vast", "epic_cinematic_science_fiction_vast.mp4"],
    ["forbidden_city_paper_plane_aerial", "run_0032_forbidden_city_paper_plane_aerial", "forbidden_city_paper_plane_aerial.mp4"],
    ["forbidden_city_paper_plane_kid", "run_0038_forbidden_city_paper_plane_kid", "forbidden_city_paper_plane_kid.mp4"],
    ["forbidden_city_snow_cat", "run_0033_forbidden_city_snow_cat", "forbidden_city_snow_cat.mp4"],
    ["frozen_lake_red_door", "run_0027_frozen_lake_red_door", "frozen_lake_red_door.mp4"],
    ["grand_dimly_lit_library_towering", "run_0001_grand_dimly_lit_library_towering", "grand_dimly_lit_library_towering.mp4"],
    ["great_wall_mounted_warrior", "run_0040_great_wall_mounted_warrior", "great_wall_mounted_warrior.mp4"],
    ["icy_wastes_lone_wanderer", "run_0035_icy_wastes_lone_wanderer", "icy_wastes_lone_wanderer.mp4"],
    ["interior_space_resembling_cluttered_magical", "run_0025_interior_space_resembling_cluttered_magical", "interior_space_resembling_cluttered_magical.mp4"],
    ["jungle_portal_robot", "run_0039_jungle_portal_robot", "jungle_portal_robot.mp4"],
    ["lush_overgrown_cave_interior_moss", "run_0014_lush_overgrown_cave_interior_moss", "lush_overgrown_cave_interior_moss.mp4"],
    ["massive_rapidly_spinning_black_hole", "run_0011_massive_rapidly_spinning_black_hole", "massive_rapidly_spinning_black_hole.mp4"],
    ["point_third_objective_external_observer", "run_0009_point_third_objective_external_observer", "point_third_objective_external_observer.mp4"],
    ["rugged_high_altitude_alpine_jagged", "run_0005_rugged_high_altitude_alpine_jagged", "rugged_high_altitude_alpine_jagged_3seg.mp4"],
    ["ruined_city_white_hair_swordsman", "run_0019_ruined_city_white_hair_swordsman", "ruined_city_white_hair_swordsman.mp4"],
    ["serene_sunlit_river_gorge_small", "run_0002_serene_sunlit_river_gorge_small", "serene_sunlit_river_gorge_small_3seg.mp4"],
    ["sky_gothic_islands_train_fpv", "run_0010_sky_gothic_islands_train_fpv", "sky_gothic_islands_train_fpv.mp4"],
    ["snowfield_lone_wanderer", "run_0015_snowfield_lone_wanderer", "snowfield_lone_wanderer.mp4"],
    ["sun_drenched_desert_city_plaza", "run_0027_sun_drenched_desert_city_plaza", "sun_drenched_desert_city_plaza.mp4"],
    ["sunlit_dense_tropical_jungle_narrow", "run_0004_sunlit_dense_tropical_jungle_narrow", "sunlit_dense_tropical_jungle_narrow_3seg.mp4"],
    ["unimaginably_massive_black_hole_fills", "run_0019_unimaginably_massive_black_hole_fills", "unimaginably_massive_black_hole_fills.mp4"],
    ["vast_aerial_landscape_rolling_green", "run_0029_vast_aerial_landscape_rolling_green", "vast_aerial_landscape_rolling_green.mp4"],
    ["vast_aerial_sprawling_urban_natural", "run_0013_vast_aerial_sprawling_urban_natural", "vast_aerial_sprawling_urban_natural.mp4"],
    ["vast_open_launchpad_area_rocket", "run_0001_vast_open_launchpad_area_rocket", "vast_open_launchpad_area_rocket.mp4"],
    ["vast_open_wilderness_landscape_rolling", "run_0028_vast_open_wilderness_landscape_rolling", "vast_open_wilderness_landscape_rolling.mp4"],
    ["vibrant_sunlit_underwater_coral_reef", "run_0001_vibrant_sunlit_underwater_coral_reef", "vibrant_sunlit_underwater_coral_reef_3seg.mp4"],
    ["wet_urban_street_night_flanked", "run_0021_wet_urban_street_night_flanked", "wet_urban_street_night_flanked.mp4"]
  ];

  const titleFromSlug = (slug) => slug.replace(/^e2e_30s_/, "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const chapterDefinitions = [
    {
      id: "fpp-world-generalization",
      folder: "01-fpp-world-generalization",
      number: "01",
      label: "FPP / WORLD GENERALIZATION",
      title: "Worlds that hold together from the observer's view.",
      description: "Outdoor, indoor, stylized, underwater, and fantastic scenes share one first-person camera-intent interface.",
      slugs: [],
      localFiles: [
        ["case_34_action", "case_34_action.mp4"],
        ["case_59_action", "case_59_action.mp4"],
        ["case_joyimg_0048_combined", "case_joyimg_0048_combined.mp4"],
        ["case_joyimg_0058_combined", "case_joyimg_0058_combined.mp4"],
        ["case_joyimg_0060_combined", "case_joyimg_0060_combined.mp4"],
        ["catlibrary", "catlibrary.mp4", "Cat Library"],
        ["dense_urban_street_wires", "dense_urban_street_wires (2).mp4", "Dense Urban Street Wires"],
        ["interior_space_resembling_cluttered_magical_action", "interior_space_resembling_cluttered_magical_action.mp4"],
        ["jungle_portal_robot_action", "jungle_portal_robot_action.mp4", "Jungle Portal Robot"],
        ["jungle_temple_compass_fpv", "jungle_temple_compass_fpv.mp4", "Jungle Temple Compass"],
        ["magic_library_floating", "magic_library_floating_b..._interpolated_final (1).mp4", "Floating Magic Library"],
        ["magical_study_workshop", "magical_study_workshop_3..._interpolated_final (2).mp4", "Magical Study Workshop"],
        ["nightfox", "nightfox.mp4", "Night Fox"],
        ["output_action_46", "output_action (46).mp4", "Action Output 46"],
        ["sunny_garden_courtyard", "sunny_graden_courtyard (3).mp4", "Sunny Garden Courtyard"],
        ["case_177_combined_continuous_ui", "case_177_combined_continuous_ui.mp4"],
        ["ti2av_r013_demo424_d0255_wmb_t42_seed4", "ti2av_r013_demo424_d0255-wmb-t42_seed4_continuous_ui.mp4"],
        ["ti2av_r021_demo424_d0302_wm10s_t09_seed8", "ti2av_r021_demo424_d0302-wm10s-t09_seed8_continuous_ui.mp4"],
        ["ti2av_r023_sana_c035_easy_indoor_016_seed3", "ti2av_r023_sana_c035-easy-indoor_016_seed3_continuous_ui.mp4"]
      ],
      remoteFiles: [
        ["game1", "https://mayanwen.bj.bcebos.com/datatransfer/echo15-page-assets-20260824/videos/game1.mp4", "Game World 1"],
        ["ti2av_r000_demo424_d0181_wmb_t27_seed1", "https://mayanwen.bj.bcebos.com/datatransfer/echo15-page-assets-20260824/videos/ti2av_r000_demo424_d0181-wmb-t27_seed1_continuous_ui.mp4", "WBench First-Person Rollout"],
        ["ti2av_r010_demo424_d0179_wmb_t25_seed16", "https://mayanwen.bj.bcebos.com/datatransfer/echo15-page-assets-20260824/videos/ti2av_r010_demo424_d0179-wmb-t25_seed16_continuous_ui.mp4", "WBench First-Person Rollout 010"],
        ["game3", "https://mayanwen.bj.bcebos.com/datatransfer/echo15-page-assets-20260824/videos/game3.mp4", "Game World 3"]
      ]
    },
    {
      id: "tpp-camera-subject-control",
      folder: "02-tpp-camera-subject-control",
      number: "02",
      label: "TPP / CAMERA + SUBJECT CONTROL",
      title: "Camera motion and subject motion, together.",
      description: "Human, animal, robot, vehicle, and mixed-subject scenes respond to a controllable third-person trajectory.",
      slugs: [],
      localFiles: [
        ["abandoned_room_toy_car_smooth", "abandoned_room_toy_car_smooth (1).mp4", "Abandoned Room Toy Car"],
        ["battlefield_biomech_horse", "battlefield_biomech_horse.mp4", "Battlefield Biomech Horse"],
        ["bioluminescent_forest", "bioluminescent_forest (2).mp4", "Bioluminescent Forest"],
        ["chain_action_30fps", "chain_action_30fps_ (3).mp4", "Third-Person Chain Action"],
        ["desert_dunes_horse_rider_smooth", "desert_dunes_horse_rider_smooth.mp4", "Desert Dunes Horse Rider"],
        ["desolate_snow_covered_alien_landscape_action", "desolate_snow_covered_al...andscape_action (1) (2).mp4", "Desolate Snow-Covered Alien Landscape"],
        ["icy_wastes_lone_wanderer_action_overlay", "icy_wastes_lone_wanderer...ined_action_overlay (1).mp4", "Icy Wastes Lone Wanderer"],
        ["jungle_portal_robot", "jungle_portal_robot (3).mp4", "Jungle Portal Robot"],
        ["ruined_city_white_hair_smooth", "ruined_city_white_hair_smooth (3).mp4", "Ruined City Swordsman"],
        ["coral_reef_orange_fish", "coral_reef_orange_fish (1).mp4", "Coral Reef Orange Fish"],
        ["forbidden_city_paper_30fps", "forbidden_city_paper_30fps_interpolated_final (1).mp4", "Forbidden City Paper Plane"],
        ["output_action_24", "output_action (24) (2).mp4", "Action Output 24"],
        ["ti2av_r005_demo424_d0008_genie_t50_seed16", "ti2av_r005_demo424_d0008-genie-t50_seed16_continuous_ui.mp4"],
        ["ti2av_r003_wbench_c105_case_108_seed14", "ti2av_r003_wbench_c105-case_108_seed14_continuous_ui.mp4"],
        ["case137_continuous_ui", "case137_continuous_ui.mp4"],
        ["ti2av_r014_wbench_c117_case_120_seed2", "ti2av_r014_wbench_c117-case_120_seed2_continuous_ui.mp4"],
        ["ti2av_r000_demo424_d0223_wmb_t16_seed1", "ti2av_r000_demo424_d0223-wmb-t16_seed1_continuous_ui.mp4"],
        ["ti2av_r027_demo424_d0149_wmb_t42_seed4", "ti2av_r027_demo424_d0149-wmb-t42_seed4_continuous_ui.mp4"]
      ]
    },
    {
      id: "native-audio-visual",
      folder: "03-native-audio-visual",
      number: "03",
      label: "SPEECH / ON-SCREEN VOICE",
      title: "Voices stay inside the world.",
      description: "Short spoken lines, visible speakers, and voice-over remain synchronized with the character, camera, and surrounding scene.",
      slugs: [],
      localFiles: [
        ["desolate_snow_covered_alien_landscape_action", "desolate_snow_covered_alien_landscape_action.mp4", "Desolate Snow-Covered Alien Landscape"],
        ["icy_wastes_lone_wanderer_action_overlay", "icy_wastes_lone_wanderer...ined_action_overlay (2).mp4", "Icy Wastes Lone Wanderer"],
        ["ti2av_r000_demo424_d0016_genie_t58_seed21", "ti2av_r000_demo424_d0016-genie-t58_seed21_continuous_ui.mp4", "Speech Scene 0016"],
        ["ti2av_r001_demo424_d0300_wm10s_t52_seed21", "ti2av_r001_demo424_d0300-wm10s-t52_seed21_continuous_ui.mp4", "Speech Scene 0300"],
        ["ti2av_r001_demo424_d0304_wm10s_t29_seed12", "ti2av_r001_demo424_d0304-wm10s-t29_seed12_continuous_ui.mp4", "Speech Scene 0304"],
        ["ti2av_r024_demo424_d0206_wmb_t26_seed7", "ti2av_r024_demo424_d0206-wmb-t26_seed7_continuous_ui.mp4", "Speech Scene 0206"]
      ]
    },
    {
      id: "multi-turn",
      folder: "04-multi-turn",
      number: "04",
      label: "SWITCH / VIEWPOINT TRANSITIONS",
      title: "Switch the view. Keep the world.",
      description: "Viewpoint switches preserve scene identity, motion context, and native audio as the camera moves to a new perspective.",
      slugs: [],
      localFiles: [
        ["alien_shoreline_crimson_coral", "alien_shoreline_covered_crimson_coral_action (1).mp4", "Alien Shoreline Coral"],
        ["case_138_action", "case_138_action (2).mp4", "Switch Case 138"],
        ["case_146_action", "case_146_action (1).mp4", "Switch Case 146"],
        ["devastated_battlefield_apocalyptic", "devastated_battlefield_b..._apocalyptic_action (1).mp4", "Devastated Battlefield"],
        ["golden_ancient_egyptian_market", "golden_ancient_egyptian_market_leads_action (1).mp4", "Ancient Egyptian Market"],
        ["lone_traveler_turquoise", "lone_traveler_stands_beside_turquoise_action (1).mp4", "Lone Traveler"],
        ["lone_warrior_desolate_plain", "lone_warrior_stands_desolate_plain_action (1).mp4", "Lone Warrior"],
        ["sunlit_desert_city_monument", "sunlit_desert_city_surrounds_monumental_action.mp4", "Sunlit Desert City"],
        ["sunlit_white_stone_valley", "sunlit_white_stone_valley_surrounds_action (1).mp4", "Sunlit White Stone Valley"]
      ]
    }
  ];
  const runBySlug = new Map(gradioRuns.map((run) => [run[0], run]));
  const chapterResults = document.querySelector("#chapter-results");
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"}[character]));
  const promptFallback = (slug) => `EchoWM scene generation: ${titleFromSlug(slug).toLowerCase()}. Third-person or first-person camera motion with synchronized environmental audio.`;

  chapterDefinitions.forEach((chapter) => {
    if (!chapterResults) return;
    const chapterRuns = [
      ...chapter.slugs.map((slug) => runBySlug.get(slug)).filter(Boolean).map(([slug, directory, filename]) => ({ slug, directory, filename })),
      ...(chapter.localFiles || []).map(([slug, filename, displayTitle]) => ({ slug, filename, displayTitle, local: true })),
      ...(chapter.remoteFiles || []).map(([slug, source, displayTitle]) => ({ slug, source, displayTitle, local: true, remote: true }))
    ];
    const cards = chapterRuns.map(({ slug, directory, filename, source: remoteSource, displayTitle, local }, index) => {
      const archiveSource = directory ? `../output_results/gradio_app/${directory}/${filename}` : "";
      const chapterSource = remoteSource || `./assets/optimized/results/${chapter.folder}/${filename}`;
      const promptUrl = remoteSource ? "" : `./assets/results/${chapter.folder}/prompt.txt`;
      const archivePromptUrl = directory ? `../output_results/gradio_app/${directory}/prompt.txt` : promptUrl;
      const promptIndexUrl = remoteSource ? "" : `./assets/results/${chapter.folder}/prompts.txt`;
      const archivePromptIndexUrl = directory ? `../output_results/gradio_app/${directory}/prompts.txt` : promptIndexUrl;
      const fallbackSource = local ? "" : archiveSource;
      const fallbackAttr = fallbackSource ? ` data-fallback-src="${fallbackSource}"` : "";
      const sourceLabel = local ? "SELECTED VIDEO" : "ARCHIVE VIDEO";
      const promptDetails = remoteSource ? "" : `<details class="prompt-details"><summary>View prompt</summary><p class="prompt-text">Loading prompt...</p></details>`;
      return `<article class="demo-card generated-run-card${local ? " local-card" : ""}" data-run-slug="${slug}" data-prompt-url="${promptUrl}" data-prompt-stem="${filename || ""}" data-prompt-index-url="${promptIndexUrl}" data-archive-prompt-url="${archivePromptUrl}" data-archive-prompt-index-url="${archivePromptIndexUrl}"><div class="video-frame"><video class="demo-video" data-src="${chapterSource}"${fallbackAttr} muted loop playsinline preload="metadata" controls></video><canvas class="audio-waveform" aria-hidden="true"></canvas><button class="listen-button" type="button">Listen with sound</button></div><div class="demo-card-meta"><span class="media-index">${chapter.number} / ${String(index + 1).padStart(2, "0")} / ${sourceLabel}</span><h3>${escapeHtml(displayTitle || titleFromSlug(slug))}</h3><p>${local ? "Selected video from this chapter folder." : "Representative full-length Gradio output from the local archive."}</p>${promptDetails}</div></article>`;
    }).join("");
    chapterResults.insertAdjacentHTML("beforeend", `<section class="chapter-block" aria-labelledby="${chapter.id}-title"><div class="chapter-heading"><span class="chapter-number">${chapter.number}</span><div><p class="media-index">${chapter.label}</p><h3 id="${chapter.id}-title">${chapter.title}</h3><p>${chapter.description}</p></div></div><div class="demo-grid generated-runs">${cards}</div></section>`);
  });
  document.querySelectorAll(".video-frame").forEach((frame) => {
    const video = frame.querySelector("video");
    const card = frame.closest(".demo-card, .audio-feature");
    const meta = card?.querySelector(".demo-card-meta, .audio-feature-copy");
    const source = video?.dataset.src;
    if (!video || !card || !meta || !source || source.startsWith("http") || card.dataset.promptUrl) return;
    const filename = source.split("/").pop();
    const promptUrl = source.replace(/[^/]+$/, "prompt.txt");
    card.dataset.runSlug = filename.replace(/\.mp4$/, "");
    card.dataset.promptUrl = promptUrl;
    card.dataset.promptStem = filename;
    card.dataset.promptIndexUrl = source.replace(/[^/]+$/, "prompts.txt");
    card.dataset.archivePromptUrl = promptUrl;
    card.dataset.archivePromptIndexUrl = card.dataset.promptIndexUrl;
    meta.insertAdjacentHTML("beforeend", `<details class="prompt-details"><summary>View prompt</summary><p class="prompt-text">Loading prompt...</p></details>`);
  });
  document.querySelectorAll(".video-frame").forEach((frame) => {
    if (!frame.querySelector(".audio-waveform")) frame.insertAdjacentHTML("beforeend", `<canvas class="audio-waveform" aria-hidden="true"></canvas>`);
  });
  const allGeneratedVideos = chapterResults ? [...chapterResults.querySelectorAll(".demo-video")] : [];
  demoVideos.push(...allGeneratedVideos);

  const loadVideo = (video) => {
    if (!video.src && video.dataset.src) {
      if (video.dataset.fallbackSrc) {
        video.addEventListener("error", () => {
          if (video.dataset.didFallback) return;
          video.dataset.didFallback = "true";
          video.src = video.dataset.fallbackSrc;
          video.load();
        }, { once: true });
      }
      video.src = video.dataset.src;
      video.load();
    }
    if (!reducedMotion) video.play().catch(() => {});
  };

  const promptIndexCache = new Map();
  const loadPromptIndex = async (url) => {
    if (!url) return null;
    if (!promptIndexCache.has(url)) {
      promptIndexCache.set(url, fetch(url).then(async (response) => {
        if (!response.ok) return null;
        const entries = new Map();
        (await response.text()).split(/\r?\n/).forEach((line) => {
          if (!line.trim() || line.trim().startsWith("#")) return;
          const separator = line.indexOf("\t") >= 0 ? line.indexOf("\t") : line.indexOf("|");
          if (separator < 0) return;
          entries.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
        });
        return entries;
      }).catch(() => null));
    }
    return promptIndexCache.get(url);
  };

  const promptText = async (card) => {
    const target = card.querySelector(".prompt-text");
    if (!target) return;
    try {
      const promptKeys = [card.dataset.promptStem, decodeURIComponent(card.dataset.promptStem || "")];
      for (const indexUrl of [card.dataset.promptIndexUrl, card.dataset.archivePromptIndexUrl]) {
        const index = await loadPromptIndex(indexUrl);
        const indexedPrompt = promptKeys.map((key) => index?.get(key)).find(Boolean);
        if (indexedPrompt) {
          target.textContent = indexedPrompt;
          return;
        }
      }
      const chapterRoot = card.dataset.promptUrl.replace(/prompt\.txt$/, "");
      const archiveRoot = card.dataset.archivePromptUrl.replace(/prompt\.txt$/, "");
      const promptStem = card.dataset.promptStem;
      const promptUrls = [`${chapterRoot}${promptStem}.prompt.txt`, `${chapterRoot}${promptStem}.txt`, `${chapterRoot}prompt.txt`, `${archiveRoot}${promptStem}.prompt.txt`, `${archiveRoot}${promptStem}.txt`, `${archiveRoot}prompt.txt`];
      for (const promptUrl of promptUrls) {
        const promptResponse = await fetch(promptUrl);
        if (promptResponse.ok) {
          const value = (await promptResponse.text()).trim();
          if (value) {
            target.textContent = value;
            return;
          }
        }
      }
      const metadataUrls = [`${chapterRoot}metadata.json`, `${archiveRoot}metadata.json`];
      for (const metadataUrl of metadataUrls) {
        const metadataResponse = await fetch(metadataUrl);
        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json();
          if (metadata.prompt) {
            target.textContent = metadata.prompt;
            return;
          }
        }
      }
    } catch {
      // Legacy exports do not include prompt files; the scene label is still useful context.
    }
    target.textContent = `${promptFallback(card.dataset.runSlug)} Prompt not recorded in this legacy export.`;
  };
  const waveformState = new WeakMap();
  const activateWaveform = (video) => {
    const canvas = video.closest(".video-frame")?.querySelector(".audio-waveform");
    if (!canvas) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    let state = waveformState.get(video);
    if (!state) {
      const context = new AudioContextClass();
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      const source = context.createMediaElementSource(video);
      source.connect(analyser);
      analyser.connect(context.destination);
      state = { context, analyser, source, frame: 0 };
      waveformState.set(video, state);
    }
    state.context.resume().catch(() => {});
    const draw = () => {
      if (video.paused || video.ended || video.muted) {
        state.frame = 0;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const context = canvas.getContext("2d");
      const values = new Uint8Array(state.analyser.fftSize);
      state.analyser.getByteTimeDomainData(values);
      context.clearRect(0, 0, width, height);
      context.beginPath();
      context.strokeStyle = "rgba(255, 154, 122, .94)";
      context.lineWidth = Math.max(1, ratio);
      values.forEach((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = (value / 255) * height;
        if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
      });
      context.stroke();
      state.frame = requestAnimationFrame(draw);
    };
    cancelAnimationFrame(state.frame);
    state.frame = requestAnimationFrame(draw);
  };

  const setSound = (video, enabled) => {
    video.muted = !enabled;
    video.defaultMuted = !enabled;
    if (enabled) {
      video.removeAttribute("muted");
      video.volume = 1;
    } else {
      video.setAttribute("muted", "");
    }
    if (enabled) video.play().catch(() => {});
  };

  document.querySelectorAll(".listen-button").forEach((button) => {
    button.addEventListener("click", () => {
      const video = button.closest(".video-frame")?.querySelector("video");
      if (!video) return;
      loadVideo(video);
      const enabled = video.muted;
      setSound(video, enabled);
      if (enabled) activateWaveform(video);
      video.controls = true;
      button.textContent = enabled ? "Mute sound" : "Listen with sound";
      button.setAttribute("aria-pressed", String(enabled));
    });
  });

  document.querySelectorAll(".demo-video").forEach((video) => {
    video.addEventListener("volumechange", () => {
      if (!video.muted) activateWaveform(video);
      const button = video.closest(".video-frame")?.querySelector(".listen-button");
      if (button) {
        button.textContent = video.muted ? "Listen with sound" : "Mute sound";
        button.setAttribute("aria-pressed", String(!video.muted));
      }
    });
    video.addEventListener("play", () => {
      if (!video.muted) activateWaveform(video);
    });
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          loadVideo(target);
        } else if (!target.paused) {
          target.pause();
        }
      });
    }, { rootMargin: "220px 0px", threshold: 0.08 });
    demoVideos.forEach((video) => observer.observe(video));
  } else {
    demoVideos.forEach(loadVideo);
  }

  document.addEventListener("visibilitychange", () => {
    [...document.querySelectorAll("video")].forEach((video) => {
      if (document.hidden) video.pause();
      else if (video === heroVideo || (video.dataset.src && video.getBoundingClientRect().top < window.innerHeight)) video.play().catch(() => {});
    });
  });

  const copyButton = document.querySelector("#copy-bibtex");
  const bibtex = document.querySelector("#bibtex-code");
  copyButton?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(bibtex.textContent.trim());
      copyButton.textContent = "Copied";
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(bibtex);
      selection.removeAllRanges();
      selection.addRange(range);
      copyButton.textContent = "Selected";
    }
    window.setTimeout(() => { copyButton.textContent = "Copy"; }, 1800);
  });
})();
