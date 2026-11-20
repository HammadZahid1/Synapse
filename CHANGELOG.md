# Changelog

## [Unreleased]

### Added
- Command palette with Ctrl+K and / shortcuts
- Command palette component with fuzzy command search
- useCommandPalette hook for state management
- Comprehensive README documentation
- Contributing guidelines

### Changed
- Extracted buttonVariants into separate file for fast refresh compatibility
- Extracted RouterContext into separate file for component-only exports
- Moved router hooks to separate file for fast refresh compatibility
- Wired SettingsPage and DecisionBoundaryPage into workspace routes
- Removed unused stubPage helper from workspace

### Fixed
- Removed unused imports across ML library, components, and pages
- Fixed unused variables throughout codebase
- Fixed drawPoints used before declaration in decision boundary
- Fixed regenerate used before declaration in datasets page
- Fixed settings page import and route wiring
