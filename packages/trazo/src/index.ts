export {
  Sticker,
  createStickerComponent,
  resolveConcreteColor,
  toSvgString,
  type NamedStickerProps,
  type StickerCategory,
  type StickerDef,
  type StickerLayer,
  type StickerProps,
  type ToSvgStringOptions,
} from "./scribble";

import { createStickerComponent, type StickerDef } from "./scribble";
import { oceanStickers, babySquidDef, conchShellDef, flapjackOctopusDef, seahorseDef, shrimpDef, starfishDef, seaTurtleDef, redOctopusDef, blueMinnowDef, redCrabDef, pearlClamDef, pinkJellyfishDef, dolphinDef, scallopShellDef, stripedFishDef, seaBubbleDef } from "./catalog/ocean";
import { arrowsStickers, curlyArrowDef, spiralDef, squareSpiralDef, loopRibbonDef, zigzagScribbleDef, loopArrowOrangeDef, verticalZigzagDef, downArrowDef, peachCoilDef, skyCoilDef } from "./catalog/arrows";
import { natureStickers, flowerRedDef, puffyCloudDef, flowerYellowDef, oceanWavesDef, sunBurstDef, splashDropsDef, tripleZigzagDef, spikyGrassDef, scallopedWaveDef } from "./catalog/nature";
import { heartsStickers, crownRaysDef, heartBurstDef, sixStarDef, heartChevronDef, solidStarDef, sparkleFourDef, sparkleCrossDef, bowtieLoopDef, tripleHeartSwirlDef, doubleHeartsDef, starOutlineDef, crosshairBurstDef } from "./catalog/hearts";
import { symbolsStickers, diamondDef, angerMarkDef, triangleDef, circleRingDef, asteriskDef, lightningBoltDef, questionMarkDef, exclamationMarkDef, diagonalHatchDef, hashtagDef } from "./catalog/symbols";
import { catsStickers, heartCatDef, daisyCatDef, huggingCatsDef, flowerCatDef, bowtieCatDef, stackedCatsDef, cheeringCatDef, heartHugDef } from "./catalog/cats";

export { oceanStickers, arrowsStickers, natureStickers, heartsStickers, symbolsStickers, catsStickers };
export {
  babySquidDef,
  conchShellDef,
  flapjackOctopusDef,
  seahorseDef,
  shrimpDef,
  starfishDef,
  seaTurtleDef,
  redOctopusDef,
  blueMinnowDef,
  redCrabDef,
  pearlClamDef,
  pinkJellyfishDef,
  dolphinDef,
  scallopShellDef,
  stripedFishDef,
  seaBubbleDef,
  curlyArrowDef,
  diamondDef,
  crownRaysDef,
  spiralDef,
  flowerRedDef,
  heartBurstDef,
  puffyCloudDef,
  angerMarkDef,
  triangleDef,
  flowerYellowDef,
  circleRingDef,
  oceanWavesDef,
  sixStarDef,
  sunBurstDef,
  squareSpiralDef,
  splashDropsDef,
  heartChevronDef,
  asteriskDef,
  solidStarDef,
  loopRibbonDef,
  sparkleFourDef,
  lightningBoltDef,
  sparkleCrossDef,
  questionMarkDef,
  exclamationMarkDef,
  bowtieLoopDef,
  zigzagScribbleDef,
  tripleZigzagDef,
  diagonalHatchDef,
  loopArrowOrangeDef,
  verticalZigzagDef,
  downArrowDef,
  peachCoilDef,
  tripleHeartSwirlDef,
  hashtagDef,
  doubleHeartsDef,
  starOutlineDef,
  crosshairBurstDef,
  spikyGrassDef,
  skyCoilDef,
  scallopedWaveDef,
  heartCatDef,
  daisyCatDef,
  huggingCatsDef,
  flowerCatDef,
  bowtieCatDef,
  stackedCatsDef,
  cheeringCatDef,
  heartHugDef,
};

export const BabySquid = createStickerComponent(babySquidDef);
export const ConchShell = createStickerComponent(conchShellDef);
export const FlapjackOctopus = createStickerComponent(flapjackOctopusDef);
export const Seahorse = createStickerComponent(seahorseDef);
export const Shrimp = createStickerComponent(shrimpDef);
export const Starfish = createStickerComponent(starfishDef);
export const SeaTurtle = createStickerComponent(seaTurtleDef);
export const RedOctopus = createStickerComponent(redOctopusDef);
export const BlueMinnow = createStickerComponent(blueMinnowDef);
export const RedCrab = createStickerComponent(redCrabDef);
export const PearlClam = createStickerComponent(pearlClamDef);
export const PinkJellyfish = createStickerComponent(pinkJellyfishDef);
export const Dolphin = createStickerComponent(dolphinDef);
export const ScallopShell = createStickerComponent(scallopShellDef);
export const StripedFish = createStickerComponent(stripedFishDef);
export const SeaBubble = createStickerComponent(seaBubbleDef);
export const CurlyArrow = createStickerComponent(curlyArrowDef);
export const Diamond = createStickerComponent(diamondDef);
export const CrownRays = createStickerComponent(crownRaysDef);
export const Spiral = createStickerComponent(spiralDef);
export const FlowerRed = createStickerComponent(flowerRedDef);
export const HeartBurst = createStickerComponent(heartBurstDef);
export const PuffyCloud = createStickerComponent(puffyCloudDef);
export const AngerMark = createStickerComponent(angerMarkDef);
export const Triangle = createStickerComponent(triangleDef);
export const FlowerYellow = createStickerComponent(flowerYellowDef);
export const CircleRing = createStickerComponent(circleRingDef);
export const OceanWaves = createStickerComponent(oceanWavesDef);
export const SixStar = createStickerComponent(sixStarDef);
export const SunBurst = createStickerComponent(sunBurstDef);
export const SquareSpiral = createStickerComponent(squareSpiralDef);
export const SplashDrops = createStickerComponent(splashDropsDef);
export const HeartChevron = createStickerComponent(heartChevronDef);
export const Asterisk = createStickerComponent(asteriskDef);
export const SolidStar = createStickerComponent(solidStarDef);
export const LoopRibbon = createStickerComponent(loopRibbonDef);
export const SparkleFour = createStickerComponent(sparkleFourDef);
export const LightningBolt = createStickerComponent(lightningBoltDef);
export const SparkleCross = createStickerComponent(sparkleCrossDef);
export const QuestionMark = createStickerComponent(questionMarkDef);
export const ExclamationMark = createStickerComponent(exclamationMarkDef);
export const BowtieLoop = createStickerComponent(bowtieLoopDef);
export const ZigzagScribble = createStickerComponent(zigzagScribbleDef);
export const TripleZigzag = createStickerComponent(tripleZigzagDef);
export const DiagonalHatch = createStickerComponent(diagonalHatchDef);
export const LoopArrowOrange = createStickerComponent(loopArrowOrangeDef);
export const VerticalZigzag = createStickerComponent(verticalZigzagDef);
export const DownArrow = createStickerComponent(downArrowDef);
export const PeachCoil = createStickerComponent(peachCoilDef);
export const TripleHeartSwirl = createStickerComponent(tripleHeartSwirlDef);
export const Hashtag = createStickerComponent(hashtagDef);
export const DoubleHearts = createStickerComponent(doubleHeartsDef);
export const StarOutline = createStickerComponent(starOutlineDef);
export const CrosshairBurst = createStickerComponent(crosshairBurstDef);
export const SpikyGrass = createStickerComponent(spikyGrassDef);
export const SkyCoil = createStickerComponent(skyCoilDef);
export const ScallopedWave = createStickerComponent(scallopedWaveDef);
export const HeartCat = createStickerComponent(heartCatDef);
export const DaisyCat = createStickerComponent(daisyCatDef);
export const HuggingCats = createStickerComponent(huggingCatsDef);
export const FlowerCat = createStickerComponent(flowerCatDef);
export const BowtieCat = createStickerComponent(bowtieCatDef);
export const StackedCats = createStickerComponent(stackedCatsDef);
export const CheeringCat = createStickerComponent(cheeringCatDef);
export const HeartHug = createStickerComponent(heartHugDef);

export const trazoCatalog: readonly StickerDef[] = [
  babySquidDef,
  conchShellDef,
  flapjackOctopusDef,
  seahorseDef,
  shrimpDef,
  starfishDef,
  seaTurtleDef,
  redOctopusDef,
  blueMinnowDef,
  redCrabDef,
  pearlClamDef,
  pinkJellyfishDef,
  dolphinDef,
  scallopShellDef,
  stripedFishDef,
  seaBubbleDef,
  curlyArrowDef,
  diamondDef,
  crownRaysDef,
  spiralDef,
  flowerRedDef,
  heartBurstDef,
  puffyCloudDef,
  angerMarkDef,
  triangleDef,
  flowerYellowDef,
  circleRingDef,
  oceanWavesDef,
  sixStarDef,
  sunBurstDef,
  squareSpiralDef,
  splashDropsDef,
  heartChevronDef,
  asteriskDef,
  solidStarDef,
  loopRibbonDef,
  sparkleFourDef,
  lightningBoltDef,
  sparkleCrossDef,
  questionMarkDef,
  exclamationMarkDef,
  bowtieLoopDef,
  zigzagScribbleDef,
  tripleZigzagDef,
  diagonalHatchDef,
  loopArrowOrangeDef,
  verticalZigzagDef,
  downArrowDef,
  peachCoilDef,
  tripleHeartSwirlDef,
  hashtagDef,
  doubleHeartsDef,
  starOutlineDef,
  crosshairBurstDef,
  spikyGrassDef,
  skyCoilDef,
  scallopedWaveDef,
  heartCatDef,
  daisyCatDef,
  huggingCatsDef,
  flowerCatDef,
  bowtieCatDef,
  stackedCatsDef,
  cheeringCatDef,
  heartHugDef,
];

export function findSticker(id: string): StickerDef | undefined {
  return trazoCatalog.find((item) => item.id === id);
}
