1. Overall Plan (EXPO APP)
    - Define a step-by-step plan to build the frontend.
    - Base this on backend endpoints and required data flows.
    - Outline the main user flows (auth, navigation, dashboards, settings, etc.).

2. Screens & Components
    - Look at the backend and determine what screens are needed.
    - Do not create screens that repeat reusable components. Instead:
    - Build reusable components once.
    - Use them across screens as needed.

3. Folder Structure & Best Practices
    - Propose a modern, scalable folder structure (e.g., components/, screens/, hooks/, utils/, services/).
    - Ensure files are organized logically and consistently.
    - Do not follow the old-frontend or frontend folders — those are obsolete and must be removed.

4. Dependencies & Setup
    - Confirm all dependencies are installed (React, Tailwind, Lucide React, etc.).
    - Install anything missing.
    - Remove unnecessary frontend folders from root (old-frontend, frontend).

5. UI/UX & Styling
    - Use only Lucide React or a professional icon library (no emojis).
    - Do not use placeholder text, data, or images.
    - Ensure all screens share consistent layouts, typography, and design tokens.
    - If a page requires customization, adjust carefully while maintaining overall consistency.
    - Ensure responsiveness across devices.

6. Functionality Requirements
    - Every UI element must work:
    - Forms must submit and validate.
    - Buttons (including navbar, headers, back buttons) must function.
    - Modals, dropdowns, and inputs must behave properly.
    - No “dead UI” — all components connect to the backend.

7. Development Workflow
    - Build one thing at a time (one screen or feature).
    - After completion, stop and allow for UI/UX testing before continuing.
    - Ask clarifying questions before starting each new feature.
    - Focus on core screens first (auth, main navigation, dashboard).

8. Integration with Backend
    - For every screen, check the backend for its endpoint.
    - Ensure proper data fetching, error handling, and loading states.
    - Confirm forms and actions (login, signup, CRUD) work with backend APIs.

9. Performance & Accessibility
    - Optimize with code splitting, lazy loading, and memoization.
    - Ensure accessibility (ARIA roles, keyboard navigation).
    - Plan for future scalability of the frontend.

10. Testing & QA
    - Plan for frontend testing (Jest, React Testing Library, Cypress).
    - Test forms, navigation, API calls, and UI states.

11. Summary & Next Steps
    - Provide a roadmap: which features/screens to build first, second, etc.
    - Highlight any open questions before coding begins.
    - Confirm the frontend is structured as if for an App Store–ready product.

12. Color Palette
