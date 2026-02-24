/**
 * Utility for writing and reading stable drag payloads to/from DataTransfer.
 * This ensures drop operations work reliably even if React state is cleared during drag.
 */

export interface DragPayload {
  taskId: string;
  sourceListId: string;
}

const DRAG_MIME_TYPE = 'application/x-momentum-task';
const FALLBACK_MIME_TYPE = 'text/plain';

/**
 * Write drag payload to DataTransfer with multiple MIME types for compatibility
 */
export function writeDragPayload(dataTransfer: DataTransfer, payload: DragPayload): void {
  const jsonString = JSON.stringify(payload);
  
  try {
    // Primary: custom MIME type
    dataTransfer.setData(DRAG_MIME_TYPE, jsonString);
  } catch (e) {
    console.warn('Failed to set custom MIME type:', e);
  }
  
  try {
    // Fallback: text/plain for broader compatibility
    dataTransfer.setData(FALLBACK_MIME_TYPE, jsonString);
  } catch (e) {
    console.warn('Failed to set fallback MIME type:', e);
  }
}

/**
 * Read drag payload from DataTransfer with fallback handling
 */
export function readDragPayload(dataTransfer: DataTransfer): DragPayload | null {
  let jsonString: string | null = null;
  
  // Try custom MIME type first
  try {
    jsonString = dataTransfer.getData(DRAG_MIME_TYPE);
  } catch (e) {
    console.warn('Failed to read custom MIME type:', e);
  }
  
  // Fallback to text/plain
  if (!jsonString) {
    try {
      jsonString = dataTransfer.getData(FALLBACK_MIME_TYPE);
    } catch (e) {
      console.warn('Failed to read fallback MIME type:', e);
    }
  }
  
  // Parse and validate
  if (!jsonString) {
    return null;
  }
  
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed.taskId === 'string' && typeof parsed.sourceListId === 'string') {
      return parsed as DragPayload;
    }
  } catch (e) {
    console.warn('Failed to parse drag payload:', e);
  }
  
  return null;
}
