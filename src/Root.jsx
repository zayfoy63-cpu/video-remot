import React from "react";
import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { CodexIntro } from "./CodexIntro";

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
        durationInFrames={840}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
