# React 18 + TypeScript Best Practices

## Component Patterns

### Functional Components with TypeScript

```typescript
// Basic component pattern
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
}) => {
  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-${size} ${loading ? 'loading' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? null : children}
    </button>
  );
};
```

### Component with forwardRef

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="form-control w-full">
        {label && (
          <label className="label">
            <span className="label-text">{label}</span>
          </label>
        )}
        <input
          ref={ref}
          className={`input input-bordered w-full ${error ? 'input-error' : ''} ${className || ''}`}
          {...props}
        />
        {(error || helperText) && (
          <label className="label">
            <span className={`label-text-alt ${error ? 'text-error' : ''}`}>
              {error || helperText}
            </span>
          </label>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

## React 18 Features

### Concurrent Features

```typescript
// Automatic batching - React 18 batches all updates by default
const handleClick = () => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // These will be batched automatically
};

// useTransition for non-urgent updates
import { useTransition, startTransition } from 'react';

const [isPending, startTransition] = useTransition();

const handleSearch = (term: string) => {
  // Urgent: update input value
  setSearchTerm(term);
  
  // Non-urgent: update search results
  startTransition(() => {
    setSearchResults(search(term));
  });
};
```

### Suspense for Data Fetching

```typescript
// Loading component
const Loading = () => (
  <div className="flex justify-center items-center min-h-32">
    <span className="loading loading-spinner loading-lg"></span>
  </div>
);

// Component with Suspense
export const Dashboard = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <Suspense fallback={<Loading />}>
        <UserProfile />
      </Suspense>
      <Suspense fallback={<Loading />}>
        <ProviderConnections />
      </Suspense>
    </div>
  );
};
```

## State Management Patterns

### useState with TypeScript

```typescript
// Simple state
const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState<boolean>(false);

// Complex state with discriminated unions
type AsyncState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

const [authState, setAuthState] = useState<AsyncState<User>>({ status: 'idle' });

// State with setter type
const [providers, setProviders] = useState<Provider[]>([]);

const addProvider = useCallback((provider: Provider) => {
  setProviders(prev => [...prev, provider]);
}, []);
```

### useReducer for Complex State

```typescript
interface BlendState {
  name: string;
  friendId: string | null;
  algorithm: 'interleave' | 'weighted' | 'discovery';
  trackCount: number;
  timeRange: 'short_term' | 'medium_term' | 'long_term';
  errors: Record<string, string>;
  isSubmitting: boolean;
}

type BlendAction =
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_FRIEND'; payload: string }
  | { type: 'SET_ALGORITHM'; payload: BlendState['algorithm'] }
  | { type: 'SET_ERROR'; payload: { field: string; message: string } }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'RESET' };

const blendReducer = (state: BlendState, action: BlendAction): BlendState => {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.payload, errors: { ...state.errors, name: '' } };
    case 'SET_FRIEND':
      return { ...state, friendId: action.payload, errors: { ...state.errors, friend: '' } };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.payload.field]: action.payload.message }
      };
    case 'CLEAR_ERROR':
      const { [action.payload]: _, ...restErrors } = state.errors;
      return { ...state, errors: restErrors };
    case 'RESET':
      return initialBlendState;
    default:
      return state;
  }
};
```

## Custom Hooks Patterns

### API Hook Pattern

```typescript
interface UseApiOptions<T> {
  initialData?: T;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

type UseApiReturn<T> = {
  data: T | undefined;
  error: Error | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

export const useApi = <T>(
  fetcher: () => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> => {
  const { initialData, enabled = true, onSuccess, onError } = options;
  
  const [state, setState] = useState<{
    data: T | undefined;
    error: Error | null;
    loading: boolean;
  }>({
    data: initialData,
    error: null,
    loading: false,
  });

  const refetch = useCallback(async () => {
    if (!enabled) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await fetcher();
      setState({ data, error: null, loading: false });
      onSuccess?.(data);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState(prev => ({ ...prev, error: err, loading: false }));
      onError?.(err);
    }
  }, [fetcher, enabled, onSuccess, onError]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
};
```

### Form Hook Pattern

```typescript
interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Record<string, string>;
  onSubmit: (values: T) => Promise<void>;
}

export const useForm = <T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name as string]) {
      setErrors(prev => ({ ...prev, [name as string]: '' }));
    }
  }, [errors]);

  const setFieldTouched = useCallback((name: keyof T) => {
    setTouched(prev => ({ ...prev, [name as string]: true }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validate?.(values) || {};
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setFieldTouched,
    handleSubmit,
  };
};
```

## Error Boundary Pattern

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="hero min-h-screen bg-base-200">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="text-5xl font-bold text-error">Oops!</h1>
              <p className="py-6">Something went wrong. Please refresh the page.</p>
              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Performance Optimization

### React.memo with TypeScript

```typescript
interface ExpensiveComponentProps {
  data: ComplexData;
  onUpdate: (id: string) => void;
}

export const ExpensiveComponent = React.memo<ExpensiveComponentProps>(
  ({ data, onUpdate }) => {
    // Expensive rendering logic
    return <div>{/* Component content */}</div>;
  },
  // Custom comparison function
  (prevProps, nextProps) => {
    return prevProps.data.id === nextProps.data.id &&
           prevProps.data.version === nextProps.data.version;
  }
);
```

### useCallback and useMemo

```typescript
export const OptimizedComponent: React.FC<Props> = ({ items, filter }) => {
  // Memoize expensive calculations
  const filteredItems = useMemo(() => {
    return items.filter(item => item.category === filter);
  }, [items, filter]);

  // Memoize event handlers
  const handleItemClick = useCallback((itemId: string) => {
    // Handle click logic
  }, []);

  // Memoize components
  const itemComponents = useMemo(() => {
    return filteredItems.map(item => (
      <ItemComponent
        key={item.id}
        item={item}
        onClick={handleItemClick}
      />
    ));
  }, [filteredItems, handleItemClick]);

  return <div>{itemComponents}</div>;
};
```

## Testing Patterns

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('loading');
  });
});
```

### Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('should initialize with no user', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should login user', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('spotify');
    });
    
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```