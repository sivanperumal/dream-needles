"use client";

import { TextArea, TextField } from "@/components/admin/form-fields";
import { Card } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { Button } from "@/components/ui/button";
import { saveSettings } from "@/lib/admin/actions/content";
import type { Tables } from "@/types/database";

const SOCIAL = ["facebook", "instagram", "youtube", "whatsapp"] as const;

export function SettingsForm({
  settings,
}: {
  settings: Tables<"store_settings">;
}) {
  const [state, action, pending] = useAdminForm(async (prev, formData) => {
    // Bundle the social links into the JSON field the action expects.
    const social = Object.fromEntries(
      SOCIAL.map((k) => [k, String(formData.get(`social_${k}`) ?? "").trim()]),
    );
    formData.set("social_links", JSON.stringify(social));
    SOCIAL.forEach((k) => formData.delete(`social_${k}`));
    return saveSettings(prev, formData);
  });
  const e = state?.errors ?? {};
  const social = (settings.social_links ?? {}) as Record<string, string>;

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-2" noValidate>
      <Card title="Catalog">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <TextField
            label="What's New window (days)"
            name="whats_new_days"
            type="number"
            min="1"
            max="365"
            defaultValue={settings.whats_new_days}
            error={e.whats_new_days}
            hint="Products added within this many days appear in What's New."
          />
          <TextField
            label="Low-stock alert at"
            name="low_stock_threshold"
            type="number"
            min="0"
            defaultValue={settings.low_stock_threshold}
            hint="Shown on the dashboard."
          />
        </div>
      </Card>
      <Card title="Shipping & tax">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <TextField
            label="Free shipping above (₹)"
            name="free_shipping_threshold"
            type="number"
            min="0"
            defaultValue={settings.free_shipping_threshold}
            error={e.free_shipping_threshold}
          />
          <TextField
            label="Shipping fee below that (₹)"
            name="shipping_fee"
            type="number"
            min="0"
            defaultValue={settings.shipping_fee}
            error={e.shipping_fee}
          />
          <TextField
            label="GST rate (%)"
            name="gst_rate"
            type="number"
            min="0"
            max="28"
            step="0.01"
            defaultValue={settings.gst_rate}
            hint="Prices include GST; this only sets the amount shown."
          />
          <TextField
            label="Delivery time text"
            name="delivery_eta_text"
            defaultValue={settings.delivery_eta_text}
            error={e.delivery_eta_text}
          />
        </div>
      </Card>
      <Card title="Contact details">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <TextField
            label="Support email"
            name="contact_email"
            type="email"
            defaultValue={settings.contact_email ?? ""}
            error={e.contact_email}
            hint="Contact Us messages are emailed here. Also shown on the Contact and FAQ pages."
          />
          <TextField
            label="Phone"
            name="contact_phone"
            defaultValue={settings.contact_phone ?? ""}
          />
          <TextField
            label="WhatsApp number"
            name="whatsapp_number"
            defaultValue={settings.whatsapp_number ?? ""}
            error={e.whatsapp_number}
            hint="With country code, e.g. 919876543210. Shows the WhatsApp button."
          />
          <TextArea
            label="Store address"
            name="store_address"
            rows={2}
            defaultValue={settings.store_address ?? ""}
          />
        </div>
      </Card>
      <Card title="Social links">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {SOCIAL.map((k) => (
            <TextField
              key={k}
              label={k[0].toUpperCase() + k.slice(1)}
              name={`social_${k}`}
              type="url"
              defaultValue={social[k] ?? ""}
              placeholder="https://…"
            />
          ))}
        </div>
      </Card>
      <div className="xl:col-span-2">
        <Button type="submit" size="lg" loading={pending}>
          Save settings
        </Button>
      </div>
    </form>
  );
}
