"use client";

import { Alert, Stack } from "@mui/material";
import type { NutriWorkflowNotice } from "../hooks/useNutriPage";

type NutriWorkflowNoticesProps = {
  notices: NutriWorkflowNotice[];
};

export function NutriWorkflowNotices({ notices }: NutriWorkflowNoticesProps) {
  if (notices.length === 0) return null;

  return (
    <Stack spacing={1}>
      {notices.map((notice) => (
        <Alert key={notice.id} severity={notice.severity}>
          <strong>{notice.title}</strong> {notice.description}
        </Alert>
      ))}
    </Stack>
  );
}
