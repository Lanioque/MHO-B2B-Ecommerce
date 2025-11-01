# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]: Create Account
      - generic [ref=e6]: Get started with your e-commerce platform
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - text: Name
          - textbox "Name" [active] [ref=e10]:
            - /placeholder: John Doe
        - generic [ref=e11]:
          - text: Email
          - textbox "Email" [ref=e12]:
            - /placeholder: you@example.com
            - text: invalid-email
        - generic [ref=e13]:
          - text: Password
          - textbox "Password" [ref=e14]:
            - /placeholder: ••••••••
            - text: Password123
          - paragraph [ref=e15]: Must be at least 8 characters with uppercase, lowercase, and number
      - generic [ref=e16]:
        - button "Register" [ref=e17]
        - generic [ref=e18]:
          - text: Already have an account?
          - link "Sign In" [ref=e19]:
            - /url: /login
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e25] [cursor=pointer]:
    - img [ref=e26]
  - alert [ref=e31]
```