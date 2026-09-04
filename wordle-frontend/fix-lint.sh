#!/bin/bash
# Fix react/no-unescaped-entities
sed -i '' "s/today's/today\&apos;s/g" src/app/\(authenticated\)/daily/page.tsx
sed -i '' "s/Today's/Today\&apos;s/g" src/app/\(authenticated\)/page.tsx
sed -i '' "s/Loading today's challenge.../Loading today\&apos;s challenge.../g" src/app/\(authenticated\)/daily/page.tsx

# Fix any types in catch blocks
find src -type f -name "*.tsx" -exec sed -i '' "s/catch (err: any)/catch (err: unknown)/g" {} +
find src -type f -name "*.tsx" -exec sed -i '' "s/catch (e: any)/catch (e: unknown)/g" {} +
find src -type f -name "*.ts" -exec sed -i '' "s/catch (err: any)/catch (err: unknown)/g" {} +

# Fix unused vars in catch blocks
find src -type f -name "*.tsx" -exec sed -i '' "s/catch (err) {/catch (_err) {/g" {} +
find src -type f -name "*.tsx" -exec sed -i '' "s/catch (e) {/catch (_e) {/g" {} +
find src -type f -name "*.ts" -exec sed -i '' "s/catch (err) {/catch (_err) {/g" {} +

# Fix prefer-const
sed -i '' "s/let baseClasses =/const baseClasses =/g" src/components/game/LetterTile.tsx
