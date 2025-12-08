/**
 * Editor Types
 * Type definitions for the report editor functionality
 */

export interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ElementStyles {
  fontSize: string;
  fontWeight: string;
  color: string;
  backgroundColor: string;
  padding: string;
  margin: string;
  display: string;
  textAlign: string;
  lineHeight: string;
  fontFamily: string;
  borderRadius: string;
  border: string;
  borderColor: string;
  borderWidth: string;
  borderStyle: string;
  width: string;
  height: string;
  opacity: string;
}

export interface SelectedElementData {
  tagName: string;
  id: string | null;
  className: string | null;
  textContent: string;
  innerHTML: string;
  rect: ElementRect;
  styles: ElementStyles;
  dataset: Record<string, string>;
}

export interface ElementSelectionMessage {
  type: 'ELEMENT_SELECTED';
  data: SelectedElementData;
}

export type EditorMessage = ElementSelectionMessage;
