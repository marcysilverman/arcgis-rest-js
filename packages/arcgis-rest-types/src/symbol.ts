/* Copyright (c) 2018 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */

/**
 *
 */
export type Color = [number, number, number, number];

/**
 *
 */
const FontStyle = {
  Italic: "italic",
  Normal:  "normal",
  Oblique: "oblique"
} as const;

export type FontStyle = typeof FontStyle[keyof typeof FontStyle];

/**
 *
 */
const FontWeight = {
  Bold: "bold",
  Bolder: "bolder",
  Lighter: "lighter",
  Normal: "normal"
} as const;

export type FontWeight = typeof FontWeight[keyof typeof FontWeight];


/**
 *
 */
const FontDecoration = {
  LineThrough: "line-through",
  Underline: "underline",
  None: "none"
} as const;

export type FontDecoration = typeof FontDecoration[keyof typeof FontDecoration];


/**
 *
 */
export interface IFont {
  family?: string; // "<fontFamily>";
  size?: number; // <fontSize>;
  style?:  FontStyle;
  weight?: FontWeight;
  decoration?: FontDecoration;
}


/**
 *
 */
export interface IPictureSourced {
  url?: string; // Relative URL for static layers and full URL for dynamic layers. Access relative URL using http://<mapservice-url>/<layerId1>/images/<imageUrl11>
  imageData?: string; // "<base64EncodedImageData>";
  contentType?: string;
  width?: number;
  height?: number;
  angle?: number;
  xoffset?: number;
  yoffset?: number;
}

/**
 *
 */
const SymbolType {
  SLS: "esriSLS",
  SMS: "esriSMS",
  SFS: "esriSFS",
  PMS: "esriPMS",
  PFS: "esriPFS",
  TS: "esriTS"
}

/**
 *
 */
export interface ISymbol {
  type:
    | "esriSLS"
    | "esriSMS"
    | "esriSFS"
    | "esriPMS"
    | "esriPFS"
    | "esriTS"
    | SymbolType;
  style?: string;
}

/**
 *
 */
export interface IMarkerSymbol extends ISymbol {
  angle?: number;
  xoffset?: number;
  yoffset?: number;
}

/**
 *
 */
export interface IPictureFillSymbol extends ISymbol, IPictureSourced {
  type: "esriPFS" | SymbolType.PFS;
  outline?: ISimpleLineSymbol; // if outline has been specified
  xscale?: number;
  yscale?: number;
}

/**
 *
 */
export interface IPictureMarkerSymbol extends IMarkerSymbol, IPictureSourced {
  type: "esriPMS" | SymbolType.PMS;
}

/**
 *
 */
const SimpleMarkerSymbolStyle {
  Circle: "esriSMSCircle",
  Cross: "esriSMSCross",
  Diamond: "esriSMSDiamond",
  Square: "esriSMSSquare",
  X: "esriSMSX",
  Triangle: "esriSMSTriangle"
}

/**
 *
 */
const SimpleLineSymbolStyle {
  Dash: "esriSLSDash",
  DashDot: "esriSLSDashDot",
  DashDotDot: "esriSLSDashDotDot",
  Dot: "esriSLSDot",
  Null: "esriSLSNull",
  Solid: "esriSLSSolid"
}

/**
 *
 */
const SimpleFillSymbolStyle {
  BackwardDiagonal: "esriSFSBackwardDiagonal",
  Cross: "esriSFSCross",
  DiagonalCross: "esriSFSDiagonalCross",
  ForwardDiagonal: "esriSFSForwardDiagonal",
  Horizontal: "esriSFSHorizontal",
  Null: "esriSFSNull",
  Solid: "esriSFSSolid",
  Vertical: "esriSFSVertical"
}

/**
 *
 */
export interface ISimpleFillSymbol extends ISymbol {
  type: "esriSFS" | SymbolType.SFS;
  style?:
    | "esriSFSBackwardDiagonal"
    | "esriSFSCross"
    | "esriSFSDiagonalCross"
    | "esriSFSForwardDiagonal"
    | "esriSFSHorizontal"
    | "esriSFSNull"
    | "esriSFSSolid"
    | "esriSFSVertical"
    | SimpleFillSymbolStyle;
  color?: Color;
  outline?: ISimpleLineSymbol; // if outline has been specified
}

/**
 *
 */
export interface ISimpleLineSymbol extends ISymbol {
  type: "esriSLS" | SymbolType.SLS;
  style?:
    | "esriSLSDash"
    | "esriSLSDashDot"
    | "esriSLSDashDotDot"
    | "esriSLSDot"
    | "esriSLSNull"
    | "esriSLSSolid"
    | SimpleLineSymbolStyle;
  color?: Color;
  width?: number;
}

/**
 *
 */
export interface ISimpleMarkerSymbol extends IMarkerSymbol {
  type: "esriSMS" | SymbolType.SMS;
  style?:
    | "esriSMSCircle"
    | "esriSMSCross"
    | "esriSMSDiamond"
    | "esriSMSSquare"
    | "esriSMSX"
    | "esriSMSTriangle"
    | SimpleMarkerSymbolStyle;
  color?: Color;
  size?: number;
  outline?: ISimpleLineSymbol;
}

/**
 *
 */
const VerticalAlignment {
  Baseline: "baseline",
  Top: "top",
  Middle: "middle",
  Bottom: "bottom"
}

const HorizontalAlignment {
  Left: "left",
  Right: "right",
  Center: "center",
  Justify: "justify"
}

/**
 *
 */
export interface ITextSymbol extends IMarkerSymbol {
  type: "esriTS" | SymbolType.TS;
  color?: Color;
  backgroundColor?: Color;
  borderLineSize?: number; // <size>;
  borderLineColor?: Color;
  haloSize?: number; // <size>;
  haloColor?: Color;
  verticalAlignment?:
    | "baseline"
    | "top"
    | "middle"
    | "bottom"
    | VerticalAlignment;
  horizontalAlignment?:
    | "left"
    | "right"
    | "center"
    | "justify"
    | HorizontalAlignment;
  rightToLeft?: boolean;
  kerning?: boolean;
  font?: IFont;
  text?: string; // only applicable when specified as a client-side graphic.
}
