/**
 * 统一的API调用包装器
 * 提供标准化的错误处理、超时控制、重试机制和安全验证
 */

export interface ApiRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  validateResponse?: (response: Response) => Promise<boolean>;
}

export interface ApiResponse<T = any> {
  data: T | null;
  error: Error | null;
  status: number;
  ok: boolean;
}

/**
 * 安全地构建URL查询参数
 * 自动对所有参数值进行URL编码，防止注入攻击
 */
export const buildSafeUrl = (baseUrl: string, params?: Record<string, any>): string => {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }

  const url = new URL(baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // 确保key也是安全的
      const safeKey = encodeURIComponent(key);
      const safeValue = encodeURIComponent(String(value));
      url.searchParams.append(safeKey, safeValue);
    }
  });

  return url.toString();
};

/**
 * 验证URL是否安全（防止SSRF攻击）
 */
export const isUrlSafe = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    
    // 只允许https和http协议
    if (!['https:', 'http:'].includes(urlObj.protocol)) {
      console.error('[ApiWrapper] Unsafe protocol:', urlObj.protocol);
      return false;
    }
    
    // 不允许访问本地地址（防止SSRF）
    const hostname = urlObj.hostname.toLowerCase();
    const blockedHostnames = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '169.254.169.254', // AWS metadata endpoint
    ];
    
    if (blockedHostnames.includes(hostname) || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      console.error('[ApiWrapper] Blocked internal/private IP:', hostname);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[ApiWrapper] Invalid URL:', error);
    return false;
  }
};

/**
 * 清理日志中的敏感信息
 * 移除API密钥、token等敏感数据
 */
export const sanitizeForLog = (obj: any): any => {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    // 检查是否是URL，如果是则移除敏感参数
    try {
      const url = new URL(obj);
      const sensitiveParams = ['apikey', 'secret', 'token', 'key', 'password', 'authorization'];
      
      sensitiveParams.forEach(param => {
        if (url.searchParams.has(param)) {
          url.searchParams.set(param, '***REDACTED***');
        }
      });
      
      return url.toString();
    } catch {
      // 不是URL，直接返回
      return obj;
    }
  }
  
  if (typeof obj !== 'object') return obj;
  
  const sanitized: any = Array.isArray(obj) ? [] : {};
  const sensitiveKeys = ['apikey', 'secret', 'token', 'key', 'password', 'authorization', 'api_key', 'access_token'];
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLog(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * 统一的fetch包装器
 * 提供超时控制、重试机制、错误处理和安全验证
 */
export const safeFetch = async <T = any>(
  options: ApiRequestOptions
): Promise<ApiResponse<T>> => {
  const {
    url,
    method = 'GET',
    headers = {},
    body,
    timeout = 10000,
    retries = 1,
    retryDelay = 1000,
    validateResponse
  } = options;

  // 验证URL安全性
  if (!isUrlSafe(url)) {
    return {
      data: null,
      error: new Error('Unsafe URL detected'),
      status: 0,
      ok: false
    };
  }

  let lastError: Error | null = null;

  // 重试循环
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // 创建AbortController用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        // 构建请求配置
        const requestConfig: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          signal: controller.signal
        };

        // 只在非GET请求时添加body
        if (body && method !== 'GET') {
          requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        // 记录请求（移除敏感信息）
        console.log(`[ApiWrapper] ${method} request (attempt ${attempt}/${retries}):`, sanitizeForLog(url));

        // 发起请求
        const response = await fetch(url, requestConfig);
        
        clearTimeout(timeoutId);

        // 自定义响应验证
        if (validateResponse && !(await validateResponse(response))) {
          throw new Error(`Response validation failed for ${url}`);
        }

        // 解析响应
        let data: T | null = null;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text() as any;
        }

        // 成功返回
        if (response.ok) {
          console.log(`[ApiWrapper] Request successful: ${response.status}`);
          return {
            data,
            error: null,
            status: response.status,
            ok: true
          };
        }

        // HTTP错误
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        lastError = new Error(errorMessage);
        console.error(`[ApiWrapper] HTTP error (attempt ${attempt}/${retries}):`, errorMessage);

        // 对于4xx错误不重试
        if (response.status >= 400 && response.status < 500) {
          return {
            data,
            error: lastError,
            status: response.status,
            ok: false
          };
        }

      } finally {
        clearTimeout(timeoutId);
      }

    } catch (error: any) {
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.error(`[ApiWrapper] Request timeout (attempt ${attempt}/${retries})`);
        lastError = new Error(`Request timeout after ${timeout}ms`);
      } else {
        console.error(`[ApiWrapper] Request failed (attempt ${attempt}/${retries}):`, error.message);
      }
    }

    // 如果还有重试机会，等待后重试
    if (attempt < retries) {
      const delay = retryDelay * attempt; // 指数退避
      console.log(`[ApiWrapper] Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // 所有重试都失败
  return {
    data: null,
    error: lastError || new Error('Unknown error'),
    status: 0,
    ok: false
  };
};

/**
 * 便捷方法：GET请求
 */
export const safeGet = async <T = any>(
  url: string,
  params?: Record<string, any>,
  options?: Partial<ApiRequestOptions>
): Promise<ApiResponse<T>> => {
  const fullUrl = buildSafeUrl(url, params);
  return safeFetch<T>({
    url: fullUrl,
    method: 'GET',
    ...options
  });
};

/**
 * 便捷方法：POST请求
 */
export const safePost = async <T = any>(
  url: string,
  body?: any,
  options?: Partial<ApiRequestOptions>
): Promise<ApiResponse<T>> => {
  return safeFetch<T>({
    url,
    method: 'POST',
    body,
    ...options
  });
};

/**
 * 验证和清理用户输入
 * 防止XSS和注入攻击
 */
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') return '';
  
  // 限制长度
  let sanitized = input.trim().slice(0, maxLength);
  
  // 移除潜在的危险字符
  sanitized = sanitized.replace(/[<>\"']/g, '');
  
  return sanitized;
};

/**
 * 验证API响应数据结构
 * 确保返回的数据符合预期格式
 */
export const validateResponseData = <T>(
  data: any,
  validator: (data: any) => data is T
): T | null => {
  if (!data) return null;
  
  try {
    if (validator(data)) {
      return data;
    }
    console.error('[ApiWrapper] Response data validation failed');
    return null;
  } catch (error) {
    console.error('[ApiWrapper] Error validating response data:', error);
    return null;
  }
};

