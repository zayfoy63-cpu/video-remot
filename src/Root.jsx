import React from "react";
import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { CodexIntro } from "./CodexIntro";
import { CodexEcosysteme } from "./CodexEcosysteme";

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
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
