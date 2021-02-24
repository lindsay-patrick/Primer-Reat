export type AnchoredPositionAlign = 'first' | 'center' | 'last'

// When prettier supports template literal types...
// export type SuperSide = `${'inside' | 'outside'}-${'top' | 'bottom' | 'right' | 'left'}` | 'inside-center'
export type AnchorSide =
  | 'inside-top'
  | 'inside-bottom'
  | 'inside-left'
  | 'inside-right'
  | 'inside-center'
  | 'outside-top'
  | 'outside-bottom'
  | 'outside-left'
  | 'outside-right'

/**
 * Settings that customize how a floating element is positioned
 * with respect to an anchor element.
 */
export interface PositionSettings {
  /**
   * Sets the side of the anchor element that the floating element should be
   * pinned to. This side is given by a string starting with either "inside" or
   * "outside", followed by a hyphen, followed by either "top", "right", "bottom",
   * or "left". Additionally, "inside-center" is an allowed value.
   *
   * The first part of this string, "inside" or "outside", determines whether the
   * floating element should be attempted to be placed "inside" the anchor element
   * or "outside" of it. Using "inside" is useful for making it appear that the
   * anchor _contains_ the floating element, and it can be used for implementing a
   * dialog that is centered on the screen. The "outside" value is more common and
   * can be used for tooltips, popovers, menus, etc.
   *
   * The second part of this string determines the _edge_ on the anchor element that
   * the floating element will be anchored to. If side is "inside-center", then
   * the floating element will be centered in the X-direction (while align is used
   * to position it in the Y-direction).
   * Note: "outside-center" is _not_ a valid value for this property.
   */
  side: AnchorSide

  /**
   * Determines how the floating element should align with the anchor element. If
   * set to "first", the floating element's first edge (top or left) will align
   * with the anchor element's first edge. If set to "center", the floating
   * element will be centered along the axis of the anchor edge. If set to "last",
   * the floating element's last edge will align with the anchor element's last edge.
   */
  align: AnchoredPositionAlign

  /**
   * The number of pixels between the anchor edge and the floating element.
   *
   * Positive values move the floating element farther from the anchor element
   * (for outside positioning) or further inside the anchor element (for inside
   * positioning). Negative values have the opposite effect.
   */
  anchorOffset: number

  /**
   * An additional offset, in pixels, to move the floating element from
   * the aligning edge.
   *
   * Positive values move the floating element in the direction of center-
   * alignment. Negative values move the floating element away from center-
   * alignment. When align is "center", positive offsets move the floating
   * element right (top or bottom anchor side) or down (left or right
   * anchor side).
   */
  alignmentOffset: number

  /**
   * If true, when the above settings result in rendering the floating element
   * wholly or partially off-screen, attempt to adjust the settings to prevent
   * this. Only applies to "outside" positioning.
   *
   * First, attempt to flip to the opposite edge of the anchor if the floating
   * element is getting clipped in that direction. If flipping results in a
   * similar clipping, try moving to the adjacent sides.
   *
   * Once we find a side that does not clip the overlay in its own dimension,
   * check the rest of the sides to see if we need to adjust the alignment offset
   * to fit in other dimensions.
   *
   * If we try all four sides and get clipped each time, settle for overflowing
   * and use the "bottom" side, since the ability to scroll is most likely in
   * this direction.
   */
  preventOverflow: boolean
}

// For each outside anchor position, list the order of alternate positions to try in
// the event that the original position overflows. See comment on `preventOverflow`
// for a more detailed description.
const alternateOrders: Partial<Record<AnchorSide, [AnchorSide, AnchorSide, AnchorSide, AnchorSide]>> = {
  'outside-top': ['outside-bottom', 'outside-right', 'outside-left', 'outside-bottom'],
  'outside-bottom': ['outside-top', 'outside-right', 'outside-left', 'outside-bottom'],
  'outside-left': ['outside-right', 'outside-bottom', 'outside-top', 'outside-bottom'],
  'outside-right': ['outside-left', 'outside-bottom', 'outside-top', 'outside-bottom']
}

interface Size {
  width: number
  height: number
}

interface Position {
  top: number
  left: number
}

interface BoxPosition extends Size, Position {}

/**
 * Given a floating element and an anchor element, return coordinates for the
 * top-left of the floating element in order to absolutely position it such
 * that it appears near the anchor element.
 *
 * @param elementDimensions Dimensions of the floating element
 * @param anchorPosition Position of the anchor element
 * @param side Side of the anchor to position the floating element
 * @param align How to align the floating element with the anchor element
 * @param anchorOffset Absolute pixel offset for anchor positioning
 * @param alignmentOffset Absolute pixel offset for alignment
 * @returns {top: number, left: number} coordinates for the floating element
 */
function calculatePosition(
  elementDimensions: Size,
  anchorPosition: BoxPosition,
  side: AnchorSide,
  align: AnchoredPositionAlign,
  anchorOffset: number,
  alignmentOffset: number
) {
  const anchorRight = anchorPosition.left + anchorPosition.width
  const anchorBottom = anchorPosition.top + anchorPosition.height
  let top = -1
  let left = -1
  if (side === 'outside-top') {
    top = anchorPosition.top - anchorOffset - elementDimensions.height
  } else if (side === 'outside-bottom') {
    top = anchorBottom + anchorOffset
  } else if (side === 'outside-left') {
    left = anchorPosition.left - anchorOffset - elementDimensions.width
  } else if (side === 'outside-right') {
    left = anchorRight + anchorOffset
  }

  if (side === 'outside-top' || side === 'outside-bottom') {
    if (align === 'first') {
      left = anchorPosition.left + alignmentOffset
    } else if (align === 'center') {
      left = anchorPosition.left - (elementDimensions.width - anchorPosition.width) / 2 + alignmentOffset
    } else if (align === 'last') {
      left = anchorRight - elementDimensions.width - alignmentOffset
    }
  }

  if (side === 'outside-left' || side === 'outside-right') {
    if (align === 'first') {
      top = anchorPosition.top + alignmentOffset
    } else if (align === 'center') {
      top = anchorPosition.top - (elementDimensions.height - anchorPosition.height) / 2 + alignmentOffset
    } else if (align === 'last') {
      top = anchorBottom - elementDimensions.height - alignmentOffset
    }
  }

  if (side === 'inside-top') {
    top = anchorPosition.top + anchorOffset
  } else if (side === 'inside-bottom') {
    top = anchorBottom - anchorOffset - elementDimensions.height
  } else if (side === 'inside-left') {
    left = anchorPosition.left + anchorOffset
  } else if (side === 'inside-right') {
    left = anchorRight - anchorOffset - elementDimensions.width
  } else if (side === 'inside-center') {
    left = (anchorRight + anchorPosition.left) / 2 - elementDimensions.width / 2 + anchorOffset
  }

  if (side === 'inside-top' || side === 'inside-bottom') {
    if (align === 'first') {
      left = anchorPosition.left + alignmentOffset
    } else if (align === 'center') {
      left = anchorPosition.left - (elementDimensions.width - anchorPosition.width) / 2 + alignmentOffset
    } else if (align === 'last') {
      left = anchorRight - elementDimensions.width - alignmentOffset
    }
  } else if (side === 'inside-left' || side === 'inside-right' || side === 'inside-center') {
    if (align === 'first') {
      top = anchorPosition.top + alignmentOffset
    } else if (align === 'center') {
      top = anchorPosition.top - (elementDimensions.height - anchorPosition.height) / 2 + alignmentOffset
    } else if (align === 'last') {
      top = anchorBottom - elementDimensions.height - alignmentOffset
    }
  }

  return {top, left}
}

/**
 * Given a floating element and an anchor element, return coordinates for the top-left
 * of the floating element in order to absolutely position it such that it appears
 * near the anchor element.
 *
 * @param floatingElement Element intended to be positioned near or within an anchor
 * @param anchorElement The element to serve as the position anchor
 * @param settings Settings to determine the rules for positioning the floating element
 * @returns {top: number, left: number} coordinates for the floating element
 */
export function getAnchoredPosition(
  floatingElement: Element,
  anchorElement: Element | DOMRect,
  settings: Partial<PositionSettings> = {}
): {top: number; left: number} {
  const parentElement = getPositionedParent(floatingElement)
  const parentRect = parentElement.getBoundingClientRect()
  const parentStyle = getComputedStyle(parentElement)
  const [parentTop, parentLeft, parentRight, parentBottom] = [
    parentStyle.borderTopWidth,
    parentStyle.borderLeftWidth,
    parentStyle.borderRightWidth,
    parentStyle.borderBottomWidth
  ].map(v => parseInt(v, 10) || 0)
  const parentViewport = {
    top: parentRect.top + parentTop,
    left: parentRect.left + parentLeft,
    width: parentRect.width - parentLeft - parentRight,
    height: parentRect.height - parentTop - parentBottom
  } as BoxPosition
  const _settings = getDefaultSettings(settings)
  return pureCalculateAnchoredPosition(
    parentViewport,
    floatingElement.getBoundingClientRect(),
    anchorElement instanceof Element ? anchorElement.getBoundingClientRect() : anchorElement,
    _settings
  )
}

function shouldRecalculatePosition(
  side: AnchorSide,
  currentPos: Position,
  containerDimensions: Size,
  elementDimensions: Size
) {
  if (side === 'outside-top' || side === 'outside-bottom') {
    return currentPos.top < 0 || currentPos.top + elementDimensions.height > containerDimensions.height
  } else {
    return currentPos.left < 0 || currentPos.left + elementDimensions.width > containerDimensions.width
  }
}

/**
 * Returns the nearest proper HTMLElement parent of `element` whose
 * position is not "static", or document.body, whichever is closer
 */
function getPositionedParent(element: Element) {
  let parentNode = element.parentNode
  while (parentNode != undefined) {
    if (parentNode instanceof HTMLElement && getComputedStyle(parentNode).position !== 'static') {
      return parentNode
    }
    parentNode = parentNode.parentNode
  }
  return document.body
}

// Default settings to position a floating element
const positionDefaults: PositionSettings = {
  side: 'outside-bottom',
  align: 'first',

  // note: the following default is not applied if side === "inside-center"
  anchorOffset: 4,

  // note: the following default is only applied if side starts with "inside"
  // and align is not center
  alignmentOffset: 4,

  preventOverflow: true
}

/**
 * Compute a full PositionSettings object from the given partial PositionSettings object
 * by filling in with defaults where applicable.
 * @param settings Partial settings - any omissions will be defaulted
 */
function getDefaultSettings(settings: Partial<PositionSettings> = {}): PositionSettings {
  const side = settings.side ?? positionDefaults.side
  const align = settings.align ?? positionDefaults.align
  return {
    side,
    align,
    // offsets always default to 0 if their respective side/alignment is centered
    anchorOffset: settings.anchorOffset ?? (side === 'inside-center' ? 0 : positionDefaults.anchorOffset),
    alignmentOffset:
      settings.alignmentOffset ??
      (align !== 'center' && side.startsWith('inside') ? positionDefaults.alignmentOffset : 0),
    preventOverflow: settings.preventOverflow ?? positionDefaults.preventOverflow
  }
}

/**
 * Note: This is a pure function with no dependency on DOM APIs (other than DOMRect). Do not
 * use this function unless you need a DOM-free, low-level implementaiton. Instead, use
 * `getAnchoredPosition`. Position settings not defaulted.
 * @see getAnchoredPosition
 * @see getDefaultSettings
 * @param parentRect BoxPosition for the closest positioned proper parent of the floating element
 * @param floatingRect WidthAndHeight for the floating element
 * @param anchorRect BoxPosition for the anchor element
 * @param PositionSettings to customize the calculated position for the floating element.
 */
function pureCalculateAnchoredPosition(
  parentRect: BoxPosition,
  floatingRect: Size,
  anchorRect: BoxPosition,
  {side, align, preventOverflow, anchorOffset, alignmentOffset}: PositionSettings
): {top: number; left: number} {
  let pos = calculatePosition(floatingRect, anchorRect, side, align, anchorOffset, alignmentOffset)
  pos.top -= parentRect.top
  pos.left -= parentRect.left

  // Handle screen overflow
  if (preventOverflow) {
    const alternateOrder = alternateOrders[side]
    let positionAttempt = 0
    if (alternateOrder) {
      let prevSide = side
      const containerDimensions = {
        // @todo allow custom container dimensions
        width: parentRect.width, // Math.max(document.body.scrollWidth, window.innerWidth),
        height: parentRect.height //Math.max(document.body.scrollHeight, window.innerHeight)
      }

      while (
        positionAttempt < alternateOrder.length &&
        shouldRecalculatePosition(prevSide, pos, containerDimensions, floatingRect)
      ) {
        const nextSide = alternateOrder[positionAttempt++]
        prevSide = nextSide

        // If we have cut off in the same dimension as the "side" option, try flipping to the opposite side.
        pos = calculatePosition(floatingRect, anchorRect, nextSide, align, anchorOffset, alignmentOffset)
        pos.top -= parentRect.top
        pos.left -= parentRect.left
      }
    }
    // At this point we've flipped the position if applicable. Now just nudge until it's on-screen.
    if (pos.top < 0) {
      pos.top = 0
    }
    if (pos.left < 0) {
      pos.left = 0
    }

    // If we have exhausted all possible positions and none of them worked, we
    // say that overflowing the bottom of the screen is acceptable since it is
    // likely to be able to scroll.
    if (alternateOrder && positionAttempt < alternateOrder.length) {
      if (pos.top + floatingRect.height > parentRect.height) {
        pos.top = parentRect.height - floatingRect.height
      }
    }
    if (pos.left + floatingRect.width > parentRect.width) {
      pos.left = parentRect.width - floatingRect.width
    }
  }
  // Adjust for a positioned parent
  return pos
}
