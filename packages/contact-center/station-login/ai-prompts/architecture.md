# Station Login Widget - Architecture

## Component Overview

The Station Login widget follows the three-layer architecture pattern: **Widget → Hook → Component → Store → SDK**. This architecture separates concerns between state management, business logic, and presentation.

### Component Table

| Layer | Component | File | Config/Props | State | Callbacks | Events | Tests |
|-------|-----------|------|--------------|-------|-----------|--------|-------|
| **Widget** | `StationLogin` | `src/station-login/index.tsx` | `StationLoginProps` | N/A (passes through) | `onLogin`, `onLogout`, `onCCSignOut`, `onSaveStart`, `onSaveEnd` | SDK events (via store) | `tests/station-login/index.tsx` |
| **Widget Internal** | `StationLoginInternal` | `src/station-login/index.tsx` | `StationLoginProps` | Observes store | Same as above | Same as above | Same |
| **Hook** | `useStationLogin` | `src/helper.ts` | `UseStationLoginProps` | `team`, `loginSuccess`, `loginFailure`, `logoutSuccess`, `originalLoginOptions`, `currentLoginOptions`, `saveError` | Wraps props callbacks | Subscribes to SDK events | `tests/helper.ts` |
| **Component** | `StationLoginComponent` | `@webex/cc-components` | `StationLoginComponentProps` | Internal form state | Inherited from hook | N/A | `@webex/cc-components` tests |
| **Store** | `Store` (singleton) | `@webex/cc-store` | N/A | `cc`, `teams`, `loginOptions`, `deviceType`, `dialNumber`, `teamId`, `isAgentLoggedIn`, `showMultipleLoginAlert` | N/A | `AGENT_STATION_LOGIN_SUCCESS`, `AGENT_LOGOUT_SUCCESS` | `@webex/cc-store` tests |
| **SDK** | `ContactCenter` | `@webex/contact-center` | N/A | N/A | N/A | Login/logout events | SDK tests |

### SDK Methods & Events Integration

| Component | SDK Methods Used | SDK Events Subscribed | Store Methods Used |
|-----------|------------------|----------------------|-------------------|
| **useStationLogin Hook** | `stationLogin()`, `stationLogout()`, `updateAgentProfile()`, `deregister()` | `AGENT_STATION_LOGIN_SUCCESS`, `AGENT_LOGOUT_SUCCESS` | `setCCCallback()`, `removeCCCallback()`, `setShowMultipleLoginAlert()`, `registerCC()` |
| **Store** | All SDK methods | All SDK events | N/A |
| **Widget** | N/A (via hook) | N/A (via store) | N/A (via hook) |

### File Structure

```
station-login/
├── src/
│   ├── helper.ts                      # useStationLogin hook
│   ├── index.ts                       # Package exports
│   └── station-login/
│       ├── index.tsx                  # Widget component
│       └── station-login.types.ts     # TypeScript types
├── tests/
│   ├── helper.ts                      # Hook tests (if exists)
│   └── station-login/
│       └── index.tsx                  # Widget tests
├── ai-prompts/
│   ├── agent.md                       # Overview, examples, usage
│   └── architecture.md                # Architecture documentation
├── dist/                              # Build output
├── package.json                       # Dependencies and scripts
├── tsconfig.json                      # TypeScript config
├── webpack.config.js                  # Webpack build config
├── jest.config.js                     # Jest test config
└── eslint.config.mjs                  # ESLint config
```

---

## Data Flows

### Layer Communication Flow

The widget follows a unidirectional data flow pattern across layers:

```mermaid
graph TB
  subgraph "Station Login Widget"
    subgraph "Presentation Layer"
        Component[StationLoginComponent]
    end
    
    subgraph "Business Logic Layer"
        Hook[useStationLogin Hook<br/>helper.ts]
    end
    
    subgraph "State Management Layer"
        Store[Store ]
    end
  end
    subgraph "SDK Layer"
        SDK[Contact Center SDK]
    end

    Hook -->|methods and states| Component
    App -->|props| StationLogin
    SDK -->|Events<br/>login success, logout| Store
    StationLogin -->|Props<br/>callbacks, config| Hook
    Hook -->|Call methods<br/>stationLogin, etc| Store
    
    Store <--> |State management| Hook
    StationLogin -->|Props<br/>state, handlers, teams| Component
    
    style Hook fill:#e1f5ff
    style Store fill:#fff4e1
    style SDK fill:#f0e1ff
```

**Hook Responsibilities:**
- Manages local state
- Subscribes to SDK events
- Handles login/logout logic
- Profile update logic
- Error handling

**Store Responsibilities:**
- Observable state
- SDK instance holder
- Event callback registry
- Global configuration

### Hook (helper.ts) Details

**File:** `src/helper.ts`

The `useStationLogin` hook is the core business logic layer that:

1. **Manages Local State:**
   - `team` - Selected team ID
   - `loginSuccess` / `loginFailure` - Login operation results
   - `logoutSuccess` - Logout operation result
   - `originalLoginOptions` / `currentLoginOptions` - For profile update comparison
   - `saveError` - Profile update error messages

2. **Subscribes to SDK Events:**
   ```typescript
   useEffect(() => {
     store.setCCCallback(CC_EVENTS.AGENT_STATION_LOGIN_SUCCESS, handleLogin);
     store.setCCCallback(CC_EVENTS.AGENT_LOGOUT_SUCCESS, handleLogout);
   }, [store.isAgentLoggedIn]);
   ```

3. **Provides Key Functions:**
   - `login()` - Calls `cc.stationLogin()` with selected options
   - `logout()` - Calls `cc.stationLogout()` with reason
   - `saveLoginOptions()` - Calls `cc.updateAgentProfile()` for profile updates
   - `handleContinue()` - Handles multiple login continuation via `store.registerCC()`
   - `handleCCSignOut()` - Performs station logout and deregistration
   - `setTeam()` - Updates selected team

4. **Profile Update Logic:**
   - Compares `originalLoginOptions` vs `currentLoginOptions`
   - Computes `isLoginOptionsChanged` to enable/disable save button
   - Only sends changed fields to SDK
   - Updates `originalLoginOptions` after successful save

### Sequence Diagrams

#### 1. Login Flow

```mermaid
sequenceDiagram
    participant App
    %% participant Widget as StationLoginWidget (observer)
    participant Component as StationLoginComponent
    participant Hook as useStationLogin Hook
    participant Store
    participant SDK

    %% App->>Widget: Renders <StationLoginWidget/>
    %% activate Widget
    %% Widget->>Hook: useStationLogin() (observer subscribes to Store)
    %% Hook->>Store: observes state (MobX reactivity)
    %% Store-->>Hook: emits state updates (auto)
    %% Hook-->>Widget: returns {state, handlers}
    %% Widget->>Component: Passes props/state
    %% activate Component
    %% Component->>Component: Render UI (teams, device types, etc.)
    %% Component-->>Widget: UI rendered
    %% deactivate Component
    %% deactivate Widget

    %% Note over Hook,Store: Observer pattern ensures reactivity
    %% DO we need this? This is how MobX works

    Note over App,Component: App Selects Device Type
    App->>Component: Select device type (Extension/Mobile)
    activate Component
    Component->>Hook: onDeviceTypeChange(type)
    activate Hook
    Hook->>Store: setDeviceType(type)
    Store-->>Hook: Updated state
    Hook-->>Component: New state
    deactivate Hook
    Component->>Component: Show appropriate fields
    deactivate Component

    Note over App,Component: App Selects Team
    App->>Component: Select team from dropdown
    activate Component
    Component->>Hook: onTeamChange(teamId)
    activate Hook
    Hook->>Store: setSelectedTeam(teamId)
    Store-->>Hook: Updated state
    Hook-->>Component: New state
    deactivate Hook
    Component->>Component: Update UI
    deactivate Component

    Note over App,SDK: App Submits Login
    App->>Component: Click Login button
    activate Component
    Component->>Hook: onLoginClick(credentials)
    activate Hook
    Hook->>SDK:   cc.stationLogin({teamId, loginOption, dialNumber})
    activate Store
        alt if Login
    Hook->>App: Invoke onLogin callback
    end
    SDK-->>Store: AGENT_STATION_LOGIN_SUCCESS/Error
    Store-->>Hook: Updated States 
    Hook-->>Component: New state
    deactivate Store
    deactivate Hook
    Component->>Component: Show success/error
    deactivate Component
```

---

#### 2. Logout Flow

```mermaid
sequenceDiagram
    participant App
    participant Component as StationLoginComponent
    participant Hook as useStationLogin Hook
    participant Store
    participant SDK

    App->>Component: Click Logout button
    activate Component
    Component->>Hook: logout()
    activate Hook
    Hook->>SDK: cc.stationLogout({ logoutReason })
    activate SDK
    SDK->>SDK: Process logout
    SDK-->>Hook: AGENT_LOGOUT_SUCCESS/Error event
    deactivate SDK
    alt if onLogout
    Hook->>App: Invoke onLogout callback
    end
    activate Store
    Store-->>Hook:  Updated states
    deactivate Store
    Hook-->>Component: New state
    deactivate Hook
    Component->>Component: Re-render (logged out UI)
    deactivate Component
```

---

#### 3. Profile Update Flow

```mermaid
sequenceDiagram
    participant App
    participant Component as StationLoginComponent
    participant Hook as useStationLogin Hook
    participant Store
    participant SDK
    App->>Component: profileMode = true
    App->>Component: Modify device type
    activate Component
    Component->>Hook: setCurrentLoginOptions({ deviceType })
    activate Hook
    Hook->>Hook: Compute isLoginOptionsChanged
    Hook-->>Component: isLoginOptionsChanged = true
    deactivate Hook
    Component->>Component: Enable Save button
    deactivate Component

    App->>Component: Click Save
    activate Component
    Component->>Hook: saveLoginOptions()
    activate Hook
    alt
    Hook->>App: Invoke onSaveStart()
    end
    Hook->>SDK: cc.updateAgentProfile(payload)
    activate SDK
    SDK->>SDK: Update agent profile
    SDK-->>Hook: Success response
    deactivate SDK
    Hook->>Hook: setOriginalLoginOptions = currentLoginOptions
    alt
    Hook->>App: Invoke onSaveEnd(true)
    end
    Hook-->>Component: Save complete
    deactivate Hook
    Component->>Component: Show success message
    Component->>Component: Disable Save button
    deactivate Component
```

---

#### 4. Multiple Login Flow

```mermaid
sequenceDiagram
    participant App
    participant Component as StationLoginComponent
    participant Hook as useStationLogin Hook
    participant Store
    participant SDK

    App->>Component: Attempt login
    activate Component
    Component->>Hook: login()
    activate Hook
    Hook->>SDK: stationLogin()
    activate SDK
    SDK->>SDK: Detect existing session
    SDK-->>Hook: Multiple login detected
    deactivate SDK
    Hook->>Store: showMultipleLoginAlert = true
    Store-->>Component: Re-render with alert
    deactivate Hook
    Component->>Component: Show alert dialog
    Component-->>App: "Already logged in elsewhere"
    deactivate Component

    App->>Component: Click Continue
    activate Component
    Component->>Hook: handleContinue()
    activate Hook
    Hook->>Store: setShowMultipleLoginAlert(false)
    Hook->>Store: registerCC()
    activate Store
    Store->>SDK: register()
    activate SDK
    SDK->>SDK: Force register
    SDK-->>Store: AGENT_STATION_LOGIN_SUCCESS
    deactivate SDK
    Store->>Store: isAgentLoggedIn = true
    Store-->>Hook: Registration complete
    deactivate Store
    Hook-->>Component: Update state
    alt
    Hook-->App: onLoginCb
    end
    deactivate Hook
    Component->>Component: Hide alert
    Component->>Component: Show logged in UI
    deactivate Component
```

---

#### 5. CC Sign Out Flow

```mermaid
sequenceDiagram
    participant App
    participant Component as StationLoginComponent
    participant Hook as useStationLogin Hook
    participant Store
    participant SDK
    participant App as Application

    App->>Component: Click Sign Out button
    activate Component
    Component->>Hook: handleCCSignOut()
    activate Hook

    Hook->>SDK: cc.stationLogout({ logoutReason })
    activate SDK
    SDK-->>Hook: AGENT_STATION_LOGOUT success
    deactivate SDK
    Hook->>SDK: cc.deregister()
    activate SDK
    SDK-->>Hook: Deregister success
    deactivate SDK

    Hook->>Hook: Invoke onCCSignOut callback
    alt
    Hook->>App: onCCSignOut()
    end
    activate App
    App->>App: Handle full sign out
    App->>App: Clear session, redirect, etc.
    deactivate App
    Hook-->>Component: Sign out complete
    deactivate Hook
    deactivate Component
```

---

## Troubleshooting Guide

### Common Issues

#### 1. Widget Not Rendering

**Symptoms:**
- Widget shows blank screen
- No error messages

**Possible Causes:**
- Store not initialized
- SDK instance not set in store
- Missing peer dependencies

**Solutions:**

```typescript
// Check if store has CC instance
import store from '@webex/cc-store';
console.log('CC instance:', store.cc); // Should not be undefined

// Ensure SDK is initialized before rendering widget
const initializeApp = async () => {
  const cc = await ContactCenter.init({ token, region });
  store.setCC(cc);
  // Now render widget
};
```

#### 2. Login Fails Silently

**Symptoms:**
- Login button clicked but nothing happens
- No error or success message

**Possible Causes:**
- SDK not initialized
- Network issues
- Invalid credentials
- Missing logger

**Solutions:**

```typescript
// Check logger
console.log('Logger:', store.logger); // Should be defined

// Enable detailed logging
store.logger.setLevel('debug');

// Check SDK events
store.setCCCallback('error', (error) => {
  console.error('SDK Error:', error);
});
```

#### 3. Profile Update Not Working

**Symptoms:**
- Save button disabled
- Changes not persisted
- `onSaveEnd` called with `false`

**Possible Causes:**
- `profileMode` not set to `true`
- No actual changes made
- SDK updateAgentProfile failing

**Solutions:**

```typescript
// Ensure profileMode is true
<StationLogin profileMode={true} />

// Check if changes are detected
const hook = useStationLogin(props);
console.log('Login options changed:', hook.isLoginOptionsChanged);

// Check save error
console.log('Save error:', hook.saveError);
```

#### 4. Multiple Login Alert Not Dismissing

**Symptoms:**
- Alert stays visible after clicking Continue
- Agent cannot proceed with login

**Possible Causes:**
- `handleContinue` not called
- `registerCC` failing
- Store state not updating

**Solutions:**

```typescript
// Check store state
console.log('Show alert:', store.showMultipleLoginAlert);

// Manually dismiss (for testing)
store.setShowMultipleLoginAlert(false);

// Check registration
store.registerCC()
  .then(() => console.log('Registered'))
  .catch(err => console.error('Registration failed:', err));
```

#### 5. Callbacks Not Firing

**Symptoms:**
- `onLogin`, `onLogout`, or `onSaveEnd` not called
- Application state not updating

**Possible Causes:**
- SDK events not properly subscribed
- Store callback registration failing
- Callback references changing

**Solutions:**

```typescript
// Ensure callbacks are stable references
const handleLogin = useCallback(() => {
  console.log('Login callback');
}, []);

// Verify SDK event subscription
useEffect(() => {
  const loginHandler = () => console.log('SDK login event');
  store.setCCCallback(CC_EVENTS.AGENT_STATION_LOGIN_SUCCESS, loginHandler);
  
  return () => {
    store.removeCCCallback(CC_EVENTS.AGENT_STATION_LOGIN_SUCCESS, loginHandler);
  };
}, []);
```

#### 6. Error Boundary Showing Empty Screen

**Symptoms:**
- Widget displays nothing
- Error callback invoked

**Possible Causes:**
- Error in hook
- Error in component rendering
- Store access error

**Solutions:**

```typescript
// Set error callback to see details
store.onErrorCallback = (component, error) => {
  console.error(`Error in ${component}:`, error);
  // Show error UI instead of blank screen
  showErrorNotification(error.message);
};

// Wrap widget with custom error boundary
<ErrorBoundary fallback={<ErrorDisplay />}>
  <StationLogin />
</ErrorBoundary>
```

---

## Related Documentation

- [Agent Documentation](./agent.md) - Usage examples and props
- [MobX Patterns](../../../../ai-docs/patterns/mobx-patterns.md) - Store patterns
- [React Patterns](../../../../ai-docs/patterns/react-patterns.md) - Component patterns
- [Testing Patterns](../../../../ai-docs/patterns/testing-patterns.md) - Testing guidelines
- [Store Documentation](../../store/ai-prompts/agent.md) - Store API reference

---

_Last Updated: 2025-11-26_
