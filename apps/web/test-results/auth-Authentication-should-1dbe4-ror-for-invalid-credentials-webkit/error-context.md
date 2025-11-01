# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]: Sign In
      - generic [ref=e6]: Enter your credentials to access your account
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - text: Email
          - textbox "Email" [active] [ref=e10]:
            - /placeholder: you@example.com
        - generic [ref=e11]:
          - text: Password
          - textbox "Password" [ref=e12]:
            - /placeholder: ••••••••
            - text: wrongpassword
      - generic [ref=e13]:
        - button "Sign In" [ref=e14]
        - generic [ref=e15]:
          - text: Don't have an account?
          - link "Register" [ref=e16]:
            - /url: /register
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e22] [cursor=pointer]:
    - img [ref=e23]
  - alert [ref=e28]
```