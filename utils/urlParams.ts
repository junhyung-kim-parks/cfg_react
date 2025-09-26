/**
 * URL 파라미터 처리를 위한 유틸리티 함수들
 */

/**
 * 현재 URL에서 쿼리 파라미터를 가져옵니다
 */
export function getUrlParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

/**
 * 선택된 폼 ID들을 URL 파라미터에서 가져옵니다
 */
export function getSelectedFormsFromUrl(): string[] {
  const params = getUrlParams();
  const selected = params.get('selected');
  return selected ? selected.split(',').filter(Boolean) : [];
}

/**
 * 선택된 폼 ID들을 URL 파라미터로 설정합니다
 */
export function setSelectedFormsInUrl(formIds: string[], basePath: string): void {
  const url = new URL(window.location.href);
  
  if (formIds.length > 0) {
    url.searchParams.set('selected', formIds.join(','));
  } else {
    url.searchParams.delete('selected');
  }
  
  // basePath가 다르면 pathname 변경
  if (basePath !== url.pathname) {
    url.pathname = basePath;
  }
  
  window.history.pushState({}, '', url.toString());
  
  // popstate 이벤트를 수동으로 트리거하여 App.tsx에서 감지하도록 함
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * 현재 URL에서 경로와 파라미터를 포함한 전체 경로를 가져옵니다
 */
export function getCurrentFullPath(): string {
  return window.location.pathname + window.location.search;
}

/**
 * 특정 경로로 선택된 폼들과 함께 이동합니다
 */
export function navigateWithSelectedForms(path: string, selectedFormIds: string[]): void {
  setSelectedFormsInUrl(selectedFormIds, path);
}