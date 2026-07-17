import React from "react";
import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { CodexIntro } from "./CodexIntro";
import { CodexEcosysteme } from "./CodexEcosysteme";
import { CodexArbre } from "./CodexArbre";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="CodexIntro"
        component={CodexIntro}
        durationInFrames={930}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="CodexEcosysteme"
        component={CodexEcosysteme}
        durationInFrames={1000}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="CodexArbre"
        component={CodexArbre}
        durationInFrames={880}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
