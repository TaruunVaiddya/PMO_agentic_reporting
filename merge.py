import sys

with open("src/lib/report-paginator.ts", "r") as f:
    lib_content = f.read()

with open("src/hooks/use-paginated-report.ts", "r") as f:
    hook_content = f.read()

# Remove imports from hook
hook_content = hook_content.replace('import { paginateReport, needsPagination, PaginationConfig } from \'@/lib/report-paginator\';', '')

with open("src/components/report-viewer/pagination/pagination-engine.ts", "w") as f:
    f.write(lib_content)
    f.write("\n\n// --- HOOK ---\n\n")
    f.write(hook_content)

print("Merged successfully")
