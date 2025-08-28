import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // 에러 로깅 (운영 환경에서는 실제 로깅 서비스로 전송)
    if (import.meta.env.PROD) {
      // 여기에 에러 리포팅 서비스 연동 (예: Sentry, LogRocket 등)
      console.error('Production error:', {
        error: error.toString(),
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      });
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
              {/* 에러 아이콘 */}
              <div className="flex justify-center mb-6">
                <div className="bg-red-100 rounded-full p-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>

              {/* 에러 메시지 */}
              <div className="text-center">
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  문제가 발생했습니다
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  예상치 못한 오류가 발생했습니다. 
                  잠시 후 다시 시도해주세요.
                </p>

                {/* 개발 환경에서만 에러 상세 정보 표시 */}
                {import.meta.env.DEV && this.state.error && (
                  <details className="mb-6 text-left">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                      에러 상세 정보
                    </summary>
                    <div className="bg-gray-100 rounded p-3 text-xs font-mono overflow-auto max-h-40">
                      <div className="text-red-600 font-semibold mb-2">
                        {this.state.error.toString()}
                      </div>
                      {this.state.errorInfo && (
                        <div className="text-gray-600">
                          {this.state.errorInfo.componentStack}
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* 액션 버튼들 */}
                <div className="space-y-3">
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex justify-center py-2 px-4 border border-transparent 
                             rounded-md shadow-sm text-sm font-medium text-white 
                             bg-primary-orange hover:bg-opacity-90 
                             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-orange
                             transition-colors"
                  >
                    다시 시도
                  </button>
                  
                  <button
                    onClick={this.handleReload}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 
                             rounded-md shadow-sm text-sm font-medium text-gray-700 
                             bg-white hover:bg-gray-50 
                             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-orange
                             transition-colors"
                  >
                    페이지 새로고침
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;