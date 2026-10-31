import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PROFESSIONAL_CLIPS,
  boneFilterFor,
  castMoodForStage,
  clipLayerFor,
  clipsForIntent,
  resolveAvatarIntent,
  talkClipsForMood,
} from "./avatar-motion";

describe("resolveAvatarIntent", () => {
  it("uses idle when nobody is speaking and no beat action", () => {
    assert.equal(
      resolveAvatarIntent({ isSpeaker: false, speaking: false, listening: false, action: null }),
      "idle",
    );
  });

  it("uses listen when attending to another speaker", () => {
    assert.equal(
      resolveAvatarIntent({ isSpeaker: false, speaking: false, listening: true, action: null }),
      "listen",
    );
  });

  it("uses speak only while audio is active — holding the floor stays still", () => {
    assert.equal(
      resolveAvatarIntent({ isSpeaker: true, speaking: false, listening: false, action: null }),
      "idle",
    );
    assert.equal(
      resolveAvatarIntent({ isSpeaker: false, speaking: true, listening: true, action: null }),
      "speak",
    );
  });

  it("lets explicit professional acts override speak/listen", () => {
    for (const action of ["nod", "shake", "phone", "write", "lean", "lookDown"] as const) {
      assert.equal(
        resolveAvatarIntent({ isSpeaker: true, speaking: true, listening: false, action }),
        action,
      );
    }
  });
});

describe("clipLayerFor", () => {
  it("keeps talk and listen off the pelvis/spine (arms or head only)", () => {
    for (const name of ["talk1", "talkAssured", "talkNervous", "listen"]) {
      const layer = clipLayerFor(name);
      assert.notEqual(layer.bones, "seated-full");
      assert.ok(layer.weight <= 1);
      assert.ok(boneFilterFor(layer));
    }
  });

  it("keeps seated idle variants as full sit_chair clips", () => {
    for (const name of ["idle", "waiting", "thoughtful"]) {
      assert.equal(clipLayerFor(name).bones, "seated-full");
      assert.equal(boneFilterFor(clipLayerFor(name)), null);
    }
  });

  it("limits the professional clip set to meeting acts", () => {
    assert.ok(PROFESSIONAL_CLIPS.includes("listen"));
    assert.ok(PROFESSIONAL_CLIPS.includes("idle"));
    assert.ok(!PROFESSIONAL_CLIPS.includes("lookAround" as never));
    assert.ok(!PROFESSIONAL_CLIPS.includes("touchFace" as never));
    assert.ok(!PROFESSIONAL_CLIPS.includes("nervousIdle" as never));
  });
});

describe("clipsForIntent", () => {
  it("maps speak to the cast talk pool; listen/idle stay still (no looping clips)", () => {
    assert.deepEqual(clipsForIntent("speak", ["talk1", "talk2"]), ["talk1", "talk2"]);
    assert.deepEqual(clipsForIntent("listen", ["talk1"]), []);
    assert.deepEqual(clipsForIntent("idle", ["talk1"]), []);
  });
});

describe("talkClipsForMood", () => {
  it("prefers talkNervous under tense/guarded pressure", () => {
    assert.equal(
      talkClipsForMood("tense", ["talkAssured", "talkRelaxed"])[0],
      "talkNervous",
    );
    assert.equal(
      talkClipsForMood("guarded", ["talk1", "talk2"])[0],
      "talkNervous",
    );
  });

  it("prefers talkAssured when warm", () => {
    assert.equal(
      talkClipsForMood("warm", ["talkRelaxed", "talk1"])[0],
      "talkAssured",
    );
  });
});

describe("castMoodForStage", () => {
  it("escalates morning warm → night guarded", () => {
    assert.equal(castMoodForStage("warm", "morning"), "warm");
    assert.equal(castMoodForStage("warm", "night"), "guarded");
    assert.equal(castMoodForStage("neutral", "night"), "tense");
  });
});
