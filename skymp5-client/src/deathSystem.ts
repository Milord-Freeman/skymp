import { hooks, Game, printConsole, Actor, Debug, once, ObjectReference, Utility } from "skyrimPlatform";
import { AnimationEventName } from "./animation";
import { RespawnNeededError } from "./errors";

/**
 * Null for allow all animations. Empty array for disallow all
 */
let gPlayerAllowAnimations: string[] | null = null;
const gPlayerId: number = 0x14;

// Blocking kill move animations
hooks.sendAnimationEvent.add({
  enter(ctx) {
    ctx.animEventName = "";
  },
  leave() { }
}, 0, 0xffffffff, "KillMove*");

hooks.sendAnimationEvent.add({
  enter(ctx) {
    if (!gPlayerAllowAnimations) return;
    if (!gPlayerAllowAnimations.includes(ctx.animEventName)) {
      ctx.animEventName = "";
    }
  },
  leave() { }
}, gPlayerId, gPlayerId);

const isPlayer = (actor: Actor): boolean => {
  return actor.getFormID() === gPlayerId;
}

export const makeActorImmortal = (act: Actor): void => {
  act.startDeferredKill();
};

export const makeActorMortal = (act: Actor): void => {
  act.endDeferredKill();
};

export const applyDeathState = (actor: Actor, isDead: boolean) => {
  if (actor.isDead() === isDead && isPlayer(actor) === false) return;
  if (isDead === true) {
    killActor(actor, null);
  } else {
    resurrectActor(actor);
  }
};

const killActor = (act: Actor, killer: Actor | null = null): void => {
  if (isPlayer(act) === true) {
    gPlayerAllowAnimations = [];
    act.setDontMove(true);
    killWithPush(act);
  } else {
    makeActorMortal(act);
    act.kill(killer);
  }
}

const resurrectActor = (act: Actor): void => {
  if (isPlayer(act) === true) {
    gPlayerAllowAnimations = null;
    act.setDontMove(false);
    ressurectWithPushKill(act);
  } else {
    throw new RespawnNeededError("needs to be respawned");
  }
}

const killWithPush = (act: Actor): void => {
  gPlayerAllowAnimations?.push(AnimationEventName.Ragdoll);
  act.pushActorAway(act, 0);
}

const ressurectWithPushKill = (act: Actor): void => {
  act.forceRemoveRagdollFromWorld().then(() =>
    once("update", () => Debug.sendAnimationEvent(act, AnimationEventName.GetUpBegin))
  );
};
